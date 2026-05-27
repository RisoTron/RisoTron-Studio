import type { DatabasePort } from './ports/DatabasePort';
import { SqliteAdapter } from './adapters/SqliteAdapter';

/**
 * Application-wide database singleton.
 * Import this from any main-process module that needs database access.
 */
export const db: DatabasePort = new SqliteAdapter();
