import path from 'node:path';
import fs from 'node:fs';
import { app } from 'electron';
import { DatabaseSync } from 'node:sqlite';
import type { DatabasePort } from '../ports/DatabasePort';

/**
 * SQLite adapter implementing the DatabasePort interface.
 * Uses built-in node:sqlite for synchronous, high-performance local storage.
 */
export class SqliteAdapter implements DatabasePort {
  private db: DatabaseSync | null = null;
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

    this.db = new DatabaseSync(dbPath);

    // Enable WAL mode for better concurrent read performance.
    this.db.exec('PRAGMA journal_mode = WAL');
    // Set schema version for future migration tracking.
    this.db.exec('PRAGMA user_version = 1');

    // Create tables within a transaction for atomicity.
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

    this.isInitialized = true;
  }

  execute(sql: string, params: unknown[] = []): { lastInsertRowid: number; changes: number } {
    this.ensureInitialized();
    const stmt = this.db!.prepare(sql);
    const result = stmt.run(...(params as any[]));
    return {
      lastInsertRowid: Number(result.lastInsertRowid),
      changes: Number(result.changes),
    };
  }

  queryAll<T>(sql: string, params: unknown[] = []): T[] {
    this.ensureInitialized();
    const stmt = this.db!.prepare(sql);
    return stmt.all(...(params as any[])) as T[];
  }

  queryOne<T>(sql: string, params: unknown[] = []): T | undefined {
    this.ensureInitialized();
    const stmt = this.db!.prepare(sql);
    const row = stmt.get(...(params as any[]));
    return row as T | undefined;
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
