import path from 'node:path';
import fs from 'node:fs';
import { app } from 'electron';
import type { DatabasePort } from '../ports/DatabasePort';

import { DatabaseSync } from 'node:sqlite';

type SqliteDatabase = InstanceType<typeof DatabaseSync>;
type SqlValue = null | number | bigint | string | Uint8Array;

/**
 * SQLite adapter implementing the DatabasePort interface.
 * Uses node:sqlite DatabaseSync for synchronous, high-performance local storage.
 */
export class SqliteAdapter implements DatabasePort {
  private db: SqliteDatabase | null = null;
  private readonly dbPath: string;
  private isInitialized = false;

  constructor(dbName = 'risotron-studio.db') {
    // In production, app.getPath('userData') returns ~/Library/Application Support/risotron-studio
    const userDataPath = app.getPath('userData');
    this.dbPath = path.join(userDataPath, dbName);
  }

  public initialize(): void {
    if (this.db) return;

    const dbDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Use Node 22 built-in synchronous SQLite
    this.db = new DatabaseSync(this.dbPath);

    // Enable WAL mode for better concurrent read performance.
    this.db.exec('PRAGMA journal_mode = WAL');
    // Enforce foreign key constraints
    this.db.exec('PRAGMA foreign_keys = ON');
    // Explicitly set user_version for future migrations
    this.db.exec('PRAGMA user_version = 1');

    // Create tables within a transaction for atomicity.
    this.db.exec('BEGIN');
    try {
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS projects (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          path TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS project_settings (
          project_id TEXT,
          key TEXT,
          value TEXT,
          PRIMARY KEY (project_id, key),
          FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS templates (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          version TEXT NOT NULL,
          installed_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);
      this.db.exec('COMMIT');
    } catch (err) {
      this.db.exec('ROLLBACK');
      throw err;
    }

    this.isInitialized = true;
  }

  execute(sql: string, params: unknown[] = []): { lastInsertRowid: number; changes: number } {
    this.ensureInitialized();
    const stmt = this.db!.prepare(sql);
    const result = stmt.run(...(params as SqlValue[]));
    return {
      lastInsertRowid: Number(result.lastInsertRowid),
      changes: Number(result.changes),
    };
  }

  queryAll<T>(sql: string, params: unknown[] = []): T[] {
    this.ensureInitialized();
    const stmt = this.db!.prepare(sql);
    return stmt.all(...(params as SqlValue[])) as T[];
  }

  queryOne<T>(sql: string, params: unknown[] = []): T | undefined {
    this.ensureInitialized();
    const stmt = this.db!.prepare(sql);
    return stmt.get(...(params as SqlValue[])) as T | undefined;
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.isInitialized = false;
    }
  }

  private ensureInitialized(): void {
    if (!this.isInitialized || !this.db) {
      throw new Error(
        'Database is not initialized. Call initialize() before performing queries.',
      );
    }
  }
}
