/**
 * Application-wide settings interface.
 * Each key maps to a user-configurable preference stored in the SQLite `settings` table.
 */
export interface AppSettings {
  /** Default project template identifier. */
  defaultTemplate: string;
  /** Default filesystem path for new projects. */
  defaultPath: string;
}

/**
 * Fallback values used when no persisted setting exists in the database.
 */
export const DEFAULT_SETTINGS: AppSettings = {
  defaultTemplate: 'electron-forge-vite',
  defaultPath: '~/RisoTronProjects',
};

/**
 * Valid setting keys — derived from AppSettings at the type level.
 * Used at runtime for IPC argument validation.
 */
export const VALID_SETTING_KEYS: ReadonlyArray<keyof AppSettings> = [
  'defaultTemplate',
  'defaultPath',
] as const;
