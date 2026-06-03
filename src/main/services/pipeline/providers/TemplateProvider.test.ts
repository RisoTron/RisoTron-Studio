// eslint-disable-next-line import/no-unresolved
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import type { PipelineContext } from '../../../../shared/types/pipeline';

// ---------------------------------------------------------------------------
// Module-level mocks — hoisted before any imports of the subject module
// ---------------------------------------------------------------------------
vi.mock('@electron-forge/core', () => ({
  api: {
    init: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('node:child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:child_process')>();
  return {
    ...actual,
    spawn: vi.fn(),
  };
});

// Import after mocks
import { api as forgeApi } from '@electron-forge/core';
import { spawn } from 'node:child_process';
import { TemplateProvider } from './TemplateProvider';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type StderrMock = {
  _dataListeners: ((chunk: Buffer) => void)[];
  on(event: string, cb: (chunk: Buffer) => void): void;
  emit(chunk: Buffer): void;
};

type MockChild = {
  pid: number;
  _listeners: Record<string, ((...args: unknown[]) => void)[]>;
  on(event: string, cb: (...args: unknown[]) => void): void;
  kill: ReturnType<typeof vi.fn>;
  stdout: { on: ReturnType<typeof vi.fn> };
  stderr: StderrMock;
};

function makeMockChild(pid: number): MockChild {
  const stderrMock: StderrMock = {
    _dataListeners: [],
    on(event: string, cb: (chunk: Buffer) => void) {
      if (event === 'data') this._dataListeners.push(cb);
    },
    emit(chunk: Buffer) {
      for (const cb of this._dataListeners) cb(chunk);
    },
  };
  return {
    pid,
    _listeners: {},
    on(event: string, cb: (...args: unknown[]) => void) {
      this._listeners[event] = this._listeners[event] ?? [];
      this._listeners[event].push(cb);
    },
    kill: vi.fn(),
    stdout: { on: vi.fn() },
    stderr: stderrMock,
  };
}

function makeTempDir(preseeded = true): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'risotron-test-'));
  if (preseeded) {
    fs.writeFileSync(
      path.join(dir, 'risotron.json'),
      JSON.stringify({ projectName: 'test-project' }, null, 2),
    );
  }
  return dir;
}

function seedPackageJson(dir: string, name = 'test-project'): void {
  fs.writeFileSync(
    path.join(dir, 'package.json'),
    JSON.stringify({ name, version: '1.0.0', dependencies: {}, devDependencies: {} }, null, 2),
  );
}

// ---------------------------------------------------------------------------
// Test suites
// ---------------------------------------------------------------------------

describe('TemplateProvider', () => {
  let tmpDir: string;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(forgeApi.init).mockResolvedValue(undefined);
    tmpDir = makeTempDir();
    seedPackageJson(tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function useSpawnOk() {
    const child = makeMockChild(9999);
    vi.mocked(spawn).mockReturnValue(child as unknown as ReturnType<typeof spawn>);
    setTimeout(() => { for (const cb of child._listeners['close'] ?? []) cb(0, null); }, 10);
    return child;
  }

  // -------------------------------------------------------------------------
  // SC1 — Forge init called with correct arguments
  // -------------------------------------------------------------------------
  describe('SC1: forge init is invoked with correct args', () => {
    it('calls api.init() with webpack template and target dir', async () => {
      useSpawnOk();
      await new TemplateProvider().execute({
        createPayload: { path: tmpDir, name: 'test-project' },
      });
      expect(forgeApi.init).toHaveBeenCalledOnce();
      expect(forgeApi.init).toHaveBeenCalledWith(
        expect.objectContaining({ dir: tmpDir, template: 'webpack' }),
      );
    });
  });

  // -------------------------------------------------------------------------
  // SC2 — electron-updater injected into package.json
  // -------------------------------------------------------------------------
  describe('SC2: electron-updater is added to package.json dependencies', () => {
    it('patches package.json with electron-updater after forge init', async () => {
      useSpawnOk();
      await new TemplateProvider().execute({
        createPayload: { path: tmpDir, name: 'test-project' },
      });
      const pkg = JSON.parse(fs.readFileSync(path.join(tmpDir, 'package.json'), 'utf-8'));
      expect(pkg.dependencies).toHaveProperty('electron-updater');
    });
  });

  // -------------------------------------------------------------------------
  // risotron.json preservation
  // -------------------------------------------------------------------------
  describe('risotron.json preservation', () => {
    it('does not overwrite risotron.json created by BaseProjectProvider', async () => {
      const original = fs.readFileSync(path.join(tmpDir, 'risotron.json'), 'utf-8');
      useSpawnOk();
      await new TemplateProvider().execute({
        createPayload: { path: tmpDir, name: 'test-project' },
      });
      expect(fs.readFileSync(path.join(tmpDir, 'risotron.json'), 'utf-8')).toEqual(original);
    });
  });

  // -------------------------------------------------------------------------
  // SC3 — Progress sub-step callbacks emitted
  // -------------------------------------------------------------------------
  describe('SC3: sub-step progress callbacks are emitted', () => {
    it('emits "Initializing Electron Forge..." and "Installing dependencies..."', async () => {
      useSpawnOk();
      const onProgress = vi.fn();
      await new TemplateProvider().execute({
        createPayload: { path: tmpDir, name: 'test-project' },
        onProgress,
      });
      const names = onProgress.mock.calls.map(
        (c) => (c[0] as { currentStageName: string }).currentStageName,
      );
      expect(names).toContain('Initializing Electron Forge...');
      expect(names).toContain('Installing dependencies...');
    });
  });

  // -------------------------------------------------------------------------
  // SC5 — npm install timeout
  // -------------------------------------------------------------------------
  describe('SC5: npm install timeout guard', () => {
    it('kills child and throws TimeoutError when npm install hangs', async () => {
      const hangChild = makeMockChild(9998); // never fires 'close'
      vi.mocked(spawn).mockReturnValue(hangChild as unknown as ReturnType<typeof spawn>);

      await expect(
        new TemplateProvider().execute({
          createPayload: { path: tmpDir, name: 'test-project' },
          npmInstallTimeoutMs: 250,
        }),
      ).rejects.toThrow(/timeout/i);

      expect(hangChild.kill).toHaveBeenCalledWith('SIGTERM');
    }, 8000);
  });

  // -------------------------------------------------------------------------
  // SC4 — Error propagation (pipeline halts)
  // -------------------------------------------------------------------------
  describe('SC4: errors are re-thrown so the pipeline halts', () => {
    it('re-throws when forge init() fails', async () => {
      vi.mocked(forgeApi.init).mockRejectedValueOnce(new Error('forge init failed'));
      await expect(
        new TemplateProvider().execute({ createPayload: { path: tmpDir, name: 'test-project' } }),
      ).rejects.toThrow('forge init failed');
    });

    it('re-throws when npm install exits with non-zero code', async () => {
      const failChild = makeMockChild(9997);
      vi.mocked(spawn).mockReturnValue(failChild as unknown as ReturnType<typeof spawn>);
      // Fire exit code 1 after a tick so the listener is registered
      setTimeout(() => { for (const cb of failChild._listeners['close'] ?? []) cb(1, null); }, 20);

      await expect(
        new TemplateProvider().execute({
          createPayload: { path: tmpDir, name: 'test-project' },
          npmInstallTimeoutMs: 10_000,
        }),
      ).rejects.toThrow(/npm install/i);
    });

    it('includes stderr output in the rejection error message', async () => {
      const failChild = makeMockChild(9996);
      vi.mocked(spawn).mockReturnValue(failChild as unknown as ReturnType<typeof spawn>);

      setTimeout(() => {
        // Emit stderr data before close
        failChild.stderr.emit(Buffer.from('peer dependency missing: react@18'));
        for (const cb of failChild._listeners['close'] ?? []) cb(1, null);
      }, 20);

      await expect(
        new TemplateProvider().execute({
          createPayload: { path: tmpDir, name: 'test-project' },
          npmInstallTimeoutMs: 10_000,
        }),
      ).rejects.toThrow('peer dependency missing: react@18');
    });

    it('does not reject twice when timeout fires and then close emits', async () => {
      const hangChild = makeMockChild(9995);
      vi.mocked(spawn).mockReturnValue(hangChild as unknown as ReturnType<typeof spawn>);

      const errors: unknown[] = [];
      const promise = new TemplateProvider()
        .execute({
          createPayload: { path: tmpDir, name: 'test-project' },
          npmInstallTimeoutMs: 150,
        })
        .catch((e) => errors.push(e));

      // Wait for timeout to fire
      await new Promise((r) => setTimeout(r, 250));
      // Now fire close (simulating OS closing the killed process)
      for (const cb of hangChild._listeners['close'] ?? []) cb(null, 'SIGTERM');
      await promise;

      // Only one rejection should have been caught
      expect(errors).toHaveLength(1);
      expect((errors[0] as Error).message).toMatch(/timeout/i);
    }, 8000);
  });
});
