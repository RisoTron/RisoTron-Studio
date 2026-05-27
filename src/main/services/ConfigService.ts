import type { DatabasePort } from '../db/ports/DatabasePort';
import { DEFAULT_SETTINGS, VALID_SETTING_KEYS } from '../../shared/types/settings';
import type { AppSettings } from '../../shared/types/settings';

/** Row shape returned by `SELECT key, value FROM settings`. */
interface SettingsRow {
  key: string;
  value: string;
}

/**
 * Safely serialise a value to JSON, rejecting types that would cause
 * silent corruption or runtime exceptions in SQLite.
 *
 * Rejects: `undefined`, `BigInt`, `NaN`, `±Infinity`.
 */
function safeJsonStringify(value: unknown): string {
  if (value === undefined) {
    throw new TypeError('Cannot serialise undefined to JSON for storage.');
  }
  if (typeof value === 'bigint') {
    throw new TypeError('Cannot serialise BigInt to JSON for storage.');
  }
  if (typeof value === 'number' && (!Number.isFinite(value))) {
    throw new TypeError(`Cannot serialise ${value} to JSON for storage.`);
  }

  return JSON.stringify(value);
}

/**
 * Parse a JSON string that was previously stored via `safeJsonStringify`.
 * Returns `undefined` when the raw string is not valid JSON so the caller
 * can fall back to defaults gracefully.
 */
function safeJsonParse(raw: string): unknown {
  try {
    const parsed: unknown = JSON.parse(raw);
    // Guard against stored NaN / Infinity that survived a prior version.
    if (typeof parsed === 'number' && !Number.isFinite(parsed)) {
      return undefined;
    }
    return parsed;
  } catch {
    return undefined;
  }
}

/**
 * Configuration service for reading / writing application settings.
 *
 * Settings are stored in the `settings` table as JSON-encoded text values.
 * Missing keys transparently fall back to `DEFAULT_SETTINGS`.
 */
export class ConfigService {
  constructor(private readonly db: DatabasePort) {}

  /**
   * Persist a single setting.  Uses UPSERT so `updated_at` always refreshes.
   */
  setSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
    const serialised = safeJsonStringify(value);
    this.db.execute(
      `INSERT INTO settings (key, value, updated_at)
       VALUES (?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(key) DO UPDATE SET
         value = excluded.value,
         updated_at = CURRENT_TIMESTAMP`,
      [key, serialised],
    );
  }

  /**
   * Retrieve a single setting, falling back to its default when absent.
   */
  getSetting<K extends keyof AppSettings>(key: K): AppSettings[K] {
    const row = this.db.queryOne<SettingsRow>(
      'SELECT value FROM settings WHERE key = ?',
      [key],
    );

    if (row) {
      const parsed = safeJsonParse(row.value);
      if (parsed !== undefined) {
        return parsed as AppSettings[K];
      }
    }

    return DEFAULT_SETTINGS[key];
  }

  /**
   * Return the full settings object, merging database rows over defaults.
   */
  getAllSettings(): AppSettings {
    const rows = this.db.queryAll<SettingsRow>('SELECT key, value FROM settings');

    const persisted: Partial<AppSettings> = {};
    for (const row of rows) {
      if (VALID_SETTING_KEYS.includes(row.key as keyof AppSettings)) {
        const parsed = safeJsonParse(row.value);
        if (parsed !== undefined) {
          (persisted as Record<string, unknown>)[row.key] = parsed;
        }
      }
    }

    return { ...DEFAULT_SETTINGS, ...persisted };
  }
}
