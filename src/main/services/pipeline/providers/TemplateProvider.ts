import fs from 'node:fs';
import path from 'node:path';
import * as childProcess from 'node:child_process';
import { api } from '@electron-forge/core';
import type { PipelineContext, IProvider, ProgressCallback } from '../../../../shared/types/pipeline';

/** Webpack Electron Forge template identifier. */
const FORGE_TEMPLATE = 'webpack';

/** Default timeout for npm install (milliseconds). */
const DEFAULT_NPM_TIMEOUT_MS = 120_000;

/**
 * TemplateProvider — Stage 1 of the scaffolding pipeline.
 *
 * Initialises a new Electron Forge project (webpack template) in the
 * directory created by BaseProjectProvider, patches package.json to add
 * electron-updater, then runs npm install with a configurable timeout.
 *
 * Reads from context:
 *   - `createPayload.path`         — destination directory (created by BaseProjectProvider)
 *   - `createPayload.name`         — project name
 *   - `onProgress`                 — optional ProgressCallback for sub-step messages
 *   - `npmInstallTimeoutMs`        — optional timeout override (for tests)
 */
export class TemplateProvider implements IProvider {
  readonly name = 'Template Generation';

  async execute(context: PipelineContext): Promise<void> {
    const payload = context['createPayload'] as { path: string; name: string };
    const onProgress = context['onProgress'] as ProgressCallback | undefined;
    const timeoutMs = (context['npmInstallTimeoutMs'] as number | undefined) ?? DEFAULT_NPM_TIMEOUT_MS;

    if (!payload?.path || !payload?.name) {
      throw new Error('[TemplateProvider] Missing createPayload.path or createPayload.name in context');
    }

    const projectPath = payload.path;

    // ------------------------------------------------------------------
    // Sub-step 1: Initialise Electron Forge project (webpack template)
    // ------------------------------------------------------------------
    this.emitProgress(onProgress, context, 'Initializing Electron Forge...');

    await api.init({
      dir: projectPath,
      template: FORGE_TEMPLATE,
      interactive: false,
      skipGit: true,
      force: true,      // allow initialising into an existing directory
    });

    // ------------------------------------------------------------------
    // Patch package.json: inject electron-updater into dependencies
    // ------------------------------------------------------------------
    const pkgPath = path.join(projectPath, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as Record<string, unknown>;

    const deps = (pkg['dependencies'] as Record<string, string> | undefined) ?? {};
    if (!deps['electron-updater']) {
      deps['electron-updater'] = '^6';
      pkg['dependencies'] = deps;
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');
    }

    // ------------------------------------------------------------------
    // Sub-step 2: npm install with timeout guard
    // ------------------------------------------------------------------
    this.emitProgress(onProgress, context, 'Installing dependencies...');

    await this.runNpmInstall(projectPath, timeoutMs);
  }

  // --------------------------------------------------------------------
  // Private helpers
  // --------------------------------------------------------------------

  private emitProgress(
    onProgress: ProgressCallback | undefined,
    context: PipelineContext,
    subStepName: string,
  ): void {
    if (!onProgress) return;

    const stageIndex = (context['currentStageIndex'] as number | undefined) ?? 0;
    const totalStages = (context['totalStages'] as number | undefined) ?? 1;

    onProgress({ stageIndex, totalStages, currentStageName: subStepName });
  }

  private runNpmInstall(cwd: string, timeoutMs: number): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const child = childProcess.spawn('npm', ['install'], {
        cwd,
        stdio: 'pipe',
        shell: false,
      });

      const timer = setTimeout(() => {
        child.kill('SIGTERM');
        reject(new Error(`TimeoutError: npm install timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      child.on('close', (code: number | null) => {
        clearTimeout(timer);
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`[TemplateProvider] npm install exited with code ${code ?? 'null'}`));
        }
      });

      child.on('error', (err: Error) => {
        clearTimeout(timer);
        reject(err);
      });
    });
  }
}
