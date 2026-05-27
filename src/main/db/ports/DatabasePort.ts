/**
 * Port interface for the application's database layer.
 * Implementations must be initialized before any query methods are called.
 */
export interface DatabasePort {
  initialize(): void;
  execute(sql: string, params?: unknown[]): { lastInsertRowid: number; changes: number };
  queryAll<T>(sql: string, params?: unknown[]): T[];
  queryOne<T>(sql: string, params?: unknown[]): T | undefined;
  close(): void;
}
