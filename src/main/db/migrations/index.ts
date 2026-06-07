/**
 * Database migration system for RisoTron Studio.
 * Each migration is versioned and applied atomically.
 */
export interface Migration {
  version: number;
  name: string;
  sql: string;
}

/**
 * Registry of all database migrations, ordered by version.
 * To add a new migration:
 * 1. Add a new entry with the next sequential version number
 * 2. Include all SQL statements needed for the schema change
 * 3. Use CREATE TABLE IF NOT EXISTS for idempotency in the initial migration
 */
export const migrations: Migration[] = [
  {
    version: 1,
    name: 'initial_schema',
    sql: `
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
    `,
  },
  {
    version: 2,
    name: 'project_crud_fields',
    sql: `
      ALTER TABLE projects ADD COLUMN template_id TEXT;
      ALTER TABLE projects ADD COLUMN providers TEXT;
      ALTER TABLE projects ADD COLUMN is_archived INTEGER DEFAULT 0;
      CREATE UNIQUE INDEX IF NOT EXISTS uq_projects_name ON projects(name) WHERE is_archived = 0;
    `,
  },
  {
    version: 3,
    name: 'credentials_table',
    sql: `
      CREATE TABLE IF NOT EXISTS credentials (
        id                INTEGER PRIMARY KEY AUTOINCREMENT,
        name              TEXT    NOT NULL,
        type              TEXT    NOT NULL CHECK(type IN ('github-pat', 'aws', 'generic-token')),
        encrypted_payload BLOB    NOT NULL,
        created_at        TEXT    NOT NULL DEFAULT (datetime('now', 'utc'))
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_credentials_name_ci
        ON credentials (name COLLATE NOCASE);
    `,
  },
  {
    version: 4,
    name: 'release_servers_table',
    sql: `
      CREATE TABLE IF NOT EXISTS release_servers (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        name            TEXT    NOT NULL,
        provider_type   TEXT    NOT NULL CHECK(provider_type IN ('github-releases', 's3', 'generic-url')),
        credential_id   INTEGER NOT NULL REFERENCES credentials(id) ON DELETE RESTRICT,
        config          TEXT    NOT NULL DEFAULT '{}',
        created_at      TEXT    NOT NULL DEFAULT (datetime('now', 'utc'))
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_release_servers_name_ci
        ON release_servers (name COLLATE NOCASE);
    `,
  },
];
