import path from 'node:path';
import fs from 'node:fs';
import { app } from 'electron';
import { DatabaseSync } from 'node:sqlite';
import type { DatabasePort } from '../ports/DatabasePort';
import { migrations } from '../migrations/index';

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
    // Enforce foreign key constraints
    this.db.exec('PRAGMA foreign_keys = ON');
    
    this.runMigrations();

    this.isInitialized = true;
  }

  private runMigrations(): void {
    // EXCLUSIVE lock: blocks all other writers and readers for the duration of this migration.
    // We lock before reading the version to prevent race conditions.
    this.db!.exec('BEGIN EXCLUSIVE');
    
    try {
      const stmt = this.db!.prepare('PRAGMA user_version');
      const { user_version: currentVersion } = stmt.get() as { user_version: number };
      
      const pendingMigrations = migrations
        .filter((m) => m.version > currentVersion)
        .sort((a, b) => a.version - b.version);

      if (pendingMigrations.length > 0) {
        console.group('Running DB Migrations');
        for (const migration of pendingMigrations) {
          console.group(`Migration v${migration.version}: ${migration.name}`);
          this.db!.exec(migration.sql);
          this.db!.exec(`PRAGMA user_version = ${migration.version}`);
          console.groupEnd();
        }
        console.groupEnd();
      }
      this.db!.exec('COMMIT');
    } catch (err) {
      try {
        this.db!.exec('ROLLBACK');
      } catch (rollbackErr) {
        console.error('Failed to rollback transaction:', rollbackErr);
      }
      console.error('Migration failed:', err);
      throw err;
    }
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
