import crypto from 'node:crypto';
import type { DatabasePort } from '../db/ports/DatabasePort';
import type { Project, CreateProjectPayload, UpdateProjectPayload } from '../../shared/types/project';

/** Row shape returned by SELECT on the `projects` table. */
interface ProjectRow {
  id: string;
  name: string;
  path: string;
  template_id: string | null;
  providers: string | null;
  is_archived: number;
  created_at: string;
  updated_at: string;
}

/**
 * Safely serialise a value to JSON, rejecting types that would cause
 * silent corruption or runtime exceptions in SQLite.
 */
function safeJsonStringify(value: unknown): string {
  if (value === undefined) {
    throw new TypeError('Cannot serialise undefined to JSON for storage.');
  }
  if (typeof value === 'bigint') {
    throw new TypeError('Cannot serialise BigInt to JSON for storage.');
  }
  if (typeof value === 'number' && !Number.isFinite(value)) {
    throw new TypeError(`Cannot serialise ${value} to JSON for storage.`);
  }
  return JSON.stringify(value);
}

/**
 * Parse a JSON string that was previously stored via `safeJsonStringify`.
 * Returns `undefined` when the raw string is not valid JSON.
 */
function safeJsonParse(raw: string): unknown {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed === 'number' && !Number.isFinite(parsed)) {
      return undefined;
    }
    return parsed;
  } catch {
    return undefined;
  }
}

/** Convert a raw database row into a typed Project object. */
function rowToProject(row: ProjectRow): Project {
  let providers: string[] = [];
  if (row.providers) {
    const parsed = safeJsonParse(row.providers);
    if (Array.isArray(parsed) && parsed.every(x => typeof x === 'string')) {
      providers = parsed as string[];
    }
  }
  return {
    id: row.id,
    name: row.name,
    path: row.path,
    template_id: row.template_id,
    providers,
    is_archived: row.is_archived,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * Repository for project CRUD operations.
 *
 * All methods are synchronous since the underlying `DatabasePort` is synchronous.
 * The `providers` field is stored as a JSON TEXT column and deserialised on read.
 */
export class ProjectRepository {
  constructor(private readonly db: DatabasePort) {}

  /**
   * Create a new project record.
   * @throws Error with `UNIQUE constraint` message if the name already exists.
   */
  create(payload: CreateProjectPayload): Project {
    const id = crypto.randomUUID();
    const providersJson = payload.providers
      ? safeJsonStringify(payload.providers)
      : null;

    try {
      this.db.execute(
        `INSERT INTO projects (id, name, path, template_id, providers, is_archived, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [id, payload.name, payload.path, payload.template_id ?? null, providersJson],
      );
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('UNIQUE constraint')) {
        throw new Error(`A project named "${payload.name}" already exists.`);
      }
      throw err;
    }

    const created = this.get(id);
    if (!created) {
      throw new Error('Failed to retrieve project after creation.');
    }
    return created;
  }

  /**
   * List all projects, optionally including archived ones.
   */
  list(includeArchived = false): Project[] {
    const sql = includeArchived
      ? 'SELECT * FROM projects ORDER BY created_at DESC'
      : 'SELECT * FROM projects WHERE is_archived = 0 ORDER BY created_at DESC';

    const rows = this.db.queryAll<ProjectRow>(sql);
    return rows.map(rowToProject);
  }

  /**
   * Retrieve a single project by ID (regardless of archive status).
   */
  get(id: string): Project | undefined {
    const row = this.db.queryOne<ProjectRow>(
      'SELECT * FROM projects WHERE id = ?',
      [id],
    );
    return row ? rowToProject(row) : undefined;
  }

  /**
   * Update an existing project's fields.
   * Only supplied fields in the payload are modified.
   */
  update(id: string, payload: UpdateProjectPayload): Project | undefined {
    const setClauses: string[] = [];
    const params: unknown[] = [];

    if (payload.name !== undefined) {
      setClauses.push('name = ?');
      params.push(payload.name);
    }
    if (payload.path !== undefined) {
      setClauses.push('path = ?');
      params.push(payload.path);
    }
    if (payload.template_id !== undefined) {
      setClauses.push('template_id = ?');
      params.push(payload.template_id);
    }
    if (payload.providers !== undefined) {
      setClauses.push('providers = ?');
      params.push(safeJsonStringify(payload.providers));
    }

    if (setClauses.length === 0) {
      return this.get(id);
    }

    setClauses.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    try {
      const result = this.db.execute(
        `UPDATE projects SET ${setClauses.join(', ')} WHERE id = ?`,
        params,
      );
      if (result.changes === 0) {
        return undefined;
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('UNIQUE constraint')) {
        throw new Error(`A project named "${payload.name}" already exists.`);
      }
      throw err;
    }

    return this.get(id);
  }

  /**
   * Soft-delete a project by setting `is_archived = 1`.
   */
  softDelete(id: string): Project | undefined {
    const result = this.db.execute(
      'UPDATE projects SET is_archived = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id],
    );
    if (result.changes === 0) {
      return undefined;
    }
    return this.get(id);
  }
}
