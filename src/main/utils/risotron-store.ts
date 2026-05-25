import fs from 'node:fs';
import path from 'node:path';
import { app } from 'electron';

export class Store<T extends Record<string, unknown>> {
  private readonly fileName: string;
  private _storePath: string | null = null;

  constructor(fileName: string) {
    this.fileName = fileName;
  }

  private get storePath(): string {
    if (!this._storePath) {
      this._storePath = path.join(app.getPath('userData'), this.fileName);
    }
    return this._storePath;
  }

  get(defaults: T, validate?: (data: unknown) => data is T): T {
    try {
      const raw = fs.readFileSync(this.storePath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new SyntaxError('JSON is not a plain object');
      }
      if (validate && !validate(parsed)) {
        throw new SyntaxError('JSON failed validation schema');
      }
      return parsed as T;
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code === 'ENOENT') {
        // File doesn't exist yet — expected on first launch
        return defaults;
      }
      if (err instanceof SyntaxError) {
        // Corrupted JSON — delete so next launch starts clean
        try { fs.unlinkSync(this.storePath); } catch { /* ignore */ }
        return defaults;
      }
      // Permission, EISDIR, or other OS errors — do NOT delete the file,
      // just fall back to defaults and let the user/system address it.
      return defaults;
    }
  }

  set(data: T): void {
    const dir = path.dirname(this.storePath);
    // Use PID + timestamp to avoid temp-file collisions between processes
    const tmpPath = `${this.storePath}.${process.pid}.${Date.now()}.tmp`;
    try {
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tmpPath, this.storePath);
    } catch (err) {
      console.warn('Failed to save risotron-store:', err);
      // Save failure must not crash the app — silently discard.
      // Clean up the temp file if it was written.
      try { fs.unlinkSync(tmpPath); } catch { /* ignore */ }
    }
  }

  clear(): void {
    try {
      fs.unlinkSync(this.storePath);
    } catch { /* ignore if not found */ }
  }
}
