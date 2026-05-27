import { createRequire } from 'module';
import path from 'node:path';
import fs from 'node:fs';
import { app } from 'electron';
import type { DatabasePort } from '../ports/DatabasePort';

// Use createRequire to load the native better-sqlite3 module.
// This is necessary because better-sqlite3 is a native Node addon
// that cannot be bundled by Vite/Rollup.
const require = createRequire(import.meta.url);
const Database = require('better-sqlite3') as typeof import('better-sqlite3');

type BetterSqlite3Database = import('better-sqlite3').Database;

/**
 * SQLite adapter implementing the DatabasePort interface.
 * Uses better-sqlite3 for synchronous, high-performance local storage.
 */
export class SqliteAdapter implements DatabasePort {
  private db: BetterSqlite3Database | null = null;
  private isInitialized = false;

  initialize(): void {
    if (this.isInitialized) {
      return;
    }

    const dbPath = path.join(app.getPath('userData'), 'risotron-studio.db');

    // Ensure the parent directory exists before opening the database.
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    this.db = new Database(dbPath);

    // Enable WAL mode for better concurrent read performance.
    this.db.pragma('journal_mode = WAL');
    // Enable foreign keys which are disabled by default in SQLite
    this.db.pragma('foreign_keys = ON');
    // Set schema version for future migration tracking.
    this.db.pragma('user_version = 1');

    // Create tables within a transaction for atomicity.
    const createSchema = this.db.transaction(() => {
      this.db!.exec(`
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
    });
    
    createSchema();

    this.isInitialized = true;
  }

  execute(sql: string, params: unknown[] = []): { lastInsertRowid: number; changes: number } {
    this.ensureInitialized();
    const stmt = this.db!.prepare(sql);
    const result = stmt.run(...params);
    return {
      lastInsertRowid: Number(result.lastInsertRowid),
      changes: result.changes,
    };
  }

  queryAll<T>(sql: string, params: unknown[] = []): T[] {
    this.ensureInitialized();
    const stmt = this.db!.prepare(sql);
    return stmt.all(...params) as T[];
  }

  queryOne<T>(sql: string, params: unknown[] = []): T | undefined {
    this.ensureInitialized();
    const stmt = this.db!.prepare(sql);
    return stmt.get(...params) as T | undefined;
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
