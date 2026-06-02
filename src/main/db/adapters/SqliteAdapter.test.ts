import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
// eslint-disable-next-line import/no-unresolved
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SqliteAdapter } from './SqliteAdapter';

const { getPath } = vi.hoisted(() => ({
  getPath: vi.fn(),
}));

vi.mock('electron', () => ({
  app: {
    getPath,
  },
}));

describe('SqliteAdapter migrations', () => {
  let adapter: SqliteAdapter;
  let userDataDir: string;

  beforeEach(() => {
    userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'risotron-sqlite-'));
    getPath.mockReturnValue(userDataDir);
    adapter = new SqliteAdapter();
  });

  afterEach(() => {
    adapter.close();
    vi.clearAllMocks();
    fs.rmSync(userDataDir, { recursive: true, force: true });
  });

  it('creates the initial schema and applies it only once', () => {
    adapter.initialize();

    const tables = adapter
      .queryAll<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
      )
      .map(({ name }) => name);

    expect(tables).toEqual(
      expect.arrayContaining(['project_settings', 'projects', 'settings', 'templates']),
    );
    expect(adapter.queryOne<{ user_version: number }>('PRAGMA user_version')?.user_version).toBe(
      2,
    );

    adapter.execute("INSERT INTO settings (key, value) VALUES ('migration-marker', 'present')");
    adapter.close();
    adapter = new SqliteAdapter();

    expect(() => adapter.initialize()).not.toThrow();
    expect(adapter.queryOne<{ user_version: number }>('PRAGMA user_version')?.user_version).toBe(
      2,
    );
    expect(
      adapter.queryOne<{ value: string }>(
        "SELECT value FROM settings WHERE key = 'migration-marker'",
      )?.value,
    ).toBe('present');
  });
});
