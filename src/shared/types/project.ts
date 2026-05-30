/**
 * A project record as stored in the SQLite `projects` table.
 * The `providers` column is stored as JSON text but exposed as an array.
 */
export interface Project {
  id: string;
  name: string;
  path: string;
  template_id: string | null;
  providers: string[];
  is_archived: number;
  created_at: string;
  updated_at: string;
}

/**
 * Payload for creating a new project.
 * `id`, `created_at`, `updated_at`, and `is_archived` are generated server-side.
 */
export interface CreateProjectPayload {
  name: string;
  path: string;
  template_id?: string;
  providers?: string[];
}

/**
 * Payload for updating an existing project.
 * All fields are optional — only supplied fields are modified.
 */
export interface UpdateProjectPayload {
  name?: string;
  path?: string;
  template_id?: string | null;
  providers?: string[];
}
