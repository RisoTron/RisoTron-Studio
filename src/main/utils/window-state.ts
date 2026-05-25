import { BrowserWindow, screen } from 'electron';
import { Store } from './risotron-store';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface WindowState {
  bounds: WindowBounds | Omit<WindowBounds, 'x' | 'y'>;
  isMaximized: boolean;
}

interface StoreSchema {
  mainWindow: WindowState;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Defaults (no x/y — Electron will auto-centre)
// ---------------------------------------------------------------------------

const DEFAULT_STATE: WindowState = {
  bounds: { width: 1200, height: 800 },
  isMaximized: false,
};

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

/** Type-guard: value is a plain object (not null, not array). */
function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Returns true when `n` is a finite number. */
function isFiniteNumber(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n);
}

/**
 * Returns true when the given window bounds overlap at least partially with
 * any currently attached display's work area. This prevents restoring a
 * window to coordinates that belong to a disconnected monitor.
 */
function boundsIntersectDisplay(bounds: WindowBounds): boolean {
  let displays;
  try {
    displays = screen.getAllDisplays();
  } catch (err) {
    console.warn('Failed to enumerate displays:', err);
    return false; // Fall back to safe defaults if screen API errors
  }
  const minOverlap = 100; // px — at least this much must be visible

  return displays.some((display) => {
    const { x, y, width, height } = display.workArea;

    const overlapX = Math.max(
      0,
      Math.min(bounds.x + bounds.width, x + width) - Math.max(bounds.x, x),
    );
    const overlapY = Math.max(
      0,
      Math.min(bounds.y + bounds.height, y + height) - Math.max(bounds.y, y),
    );

    return overlapX >= minOverlap && overlapY >= minOverlap;
  });
}

// ---------------------------------------------------------------------------
// Store singleton
// ---------------------------------------------------------------------------

const store = new Store<StoreSchema>('window-state.json');

// ---------------------------------------------------------------------------
// Minimum dimensions — must match BrowserWindow minWidth / minHeight
// ---------------------------------------------------------------------------

export const MIN_WIDTH = 800;
export const MIN_HEIGHT = 600;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Read persisted state for the main window. If no valid state is found, or
 * the saved coordinates no longer intersect an active display, returns
 * centred defaults (x/y omitted so Electron auto-centres).
 */
export function loadWindowState(): WindowState {
  const data = store.get(
    { mainWindow: { ...DEFAULT_STATE } },
    (v): v is StoreSchema => isPlainObject(v) && isPlainObject(v.mainWindow)
  );
  const saved = data.mainWindow;

  // --- strict bounds validation ---
  if (
    !isPlainObject(saved) ||
    !isPlainObject(saved.bounds) ||
    !isFiniteNumber(saved.bounds.width) ||
    !isFiniteNumber(saved.bounds.height)
  ) {
    return { ...DEFAULT_STATE };
  }

  const isMaximized = typeof saved.isMaximized === 'boolean'
    ? saved.isMaximized
    : false;

  // Clamp dimensions to match BrowserWindow minimums (800x600)
  let width = Math.max(Number(saved.bounds.width), MIN_WIDTH);
  let height = Math.max(Number(saved.bounds.height), MIN_HEIGHT);

  // Guard against absurdly large corrupted bounds (e.g. 999999999)
  try {
    const displays = screen.getAllDisplays();
    let maxWorkAreaWidth = MIN_WIDTH;
    let maxWorkAreaHeight = MIN_HEIGHT;
    for (const display of displays) {
      maxWorkAreaWidth = Math.max(maxWorkAreaWidth, display.workArea.width);
      maxWorkAreaHeight = Math.max(maxWorkAreaHeight, display.workArea.height);
    }
    width = Math.min(width, maxWorkAreaWidth);
    height = Math.min(height, maxWorkAreaHeight);
  } catch (err) {
    // If screen errors out, fallback to reasonable maximums
    width = Math.min(width, 3840);
    height = Math.min(height, 2160);
  }

  // Extract raw x/y from the validated record — these may be absent
  const rawBounds = saved.bounds as Record<string, unknown>;
  const rawX = rawBounds.x;
  const rawY = rawBounds.y;

  if (!isFiniteNumber(rawX) || !isFiniteNumber(rawY)) {
    // First launch or corrupted position — let Electron auto-centre
    return { bounds: { width, height }, isMaximized };
  }

  const fullBounds: WindowBounds = {
    x: rawX,
    y: rawY,
    width,
    height,
  };

  if (!boundsIntersectDisplay(fullBounds)) {
    // Saved position is off-screen — reset to centred defaults
    return { bounds: { width, height }, isMaximized };
  }

  // Return a fresh sanitized object — never reuse the parsed reference
  return { bounds: { ...fullBounds }, isMaximized };
}

/**
 * Attach resize, move, maximize, unmaximize and close listeners to the given
 * window so that geometry is persisted automatically.
 *
 * - `resize` and `move` are debounced at ~500 ms to reduce disk IO.
 * - `maximize` and `unmaximize` save state immediately.
 * - `close` performs a final synchronous save so no data is lost.
 */
export function trackWindowState(win: BrowserWindow): void {
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  const persist = (): void => {
    if (win.isDestroyed()) return;

    const isMaximized = win.isMaximized();
    // When maximized, getBounds() returns the maximized frame. We want to
    // store the *normal* bounds so restoring from maximized places the
    // window where it was before the user maximized it.
    const bounds = isMaximized ? win.getNormalBounds() : win.getBounds();

    const state: StoreSchema = {
      mainWindow: { bounds, isMaximized },
    };

    store.set(state);
  };

  const debouncedPersist = (): void => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(persist, 500);
  };

  win.on('resize', debouncedPersist);
  win.on('move', debouncedPersist);
  win.on('maximize', persist);
  win.on('unmaximize', persist);

  // Synchronous save on close — last chance before the process exits.
  win.on('close', () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    persist();
  });
}
