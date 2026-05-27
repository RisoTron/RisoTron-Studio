import { app, BrowserWindow, nativeTheme, ipcMain, Menu } from 'electron';
import { buildMenu } from './menu';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import started from 'electron-squirrel-startup';
import { loadWindowState, trackWindowState, MIN_WIDTH, MIN_HEIGHT } from './utils/window-state';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

// Follow the user's OS theme preference.
nativeTheme.themeSource = 'system';

const createWindow = () => {
  const state = loadWindowState();

  const mainWindow = new BrowserWindow({
    title: 'RisoTron Studio',
    ...('x' in state.bounds ? { x: state.bounds.x } : {}),
    ...('y' in state.bounds ? { y: state.bounds.y } : {}),
    width: state.bounds.width,
    height: state.bounds.height,
    minWidth: MIN_WIDTH,
    minHeight: MIN_HEIGHT,
    show: false, // prevent visual jump — show after ready-to-show
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  let hasShown = false;

  mainWindow.once('ready-to-show', () => {
    if (hasShown) return;
    hasShown = true;
    if (state.isMaximized) {
      mainWindow.maximize(); // maximize after show-ready to avoid geometry bugs
    }
    mainWindow.show();
  });

  // Fallback: force show the window after 5s if ready-to-show hangs
  setTimeout(() => {
    if (!hasShown && !mainWindow.isDestroyed()) {
      hasShown = true;
      console.warn('Fallback triggered: ready-to-show did not fire in 5s');
      if (state.isMaximized) mainWindow.maximize();
      mainWindow.show();
    }
  }, 5000);

  trackWindowState(mainWindow);

  // Navigation blocks for security
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const devUrl = typeof MAIN_WINDOW_VITE_DEV_SERVER_URL !== 'undefined' ? MAIN_WINDOW_VITE_DEV_SERVER_URL : null;
    if (devUrl && url.startsWith(devUrl)) return;
    if (url.startsWith('file://')) return;
    event.preventDefault();
  });

  mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }
};

// ── Single-instance lock ────────────────────────────────────────────────
// Acquire the lock BEFORE app.whenReady(). If another instance already
// holds the lock, quit this one immediately.
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  // A second instance was launched — focus the existing window instead.
  app.on('second-instance', () => {
    const win = BrowserWindow.getAllWindows()[0];
    if (win) {
      if (win.isMinimized()) {
        win.restore();
      }
      win.focus();
    }
  });
}
// ─────────────────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  const cachedState = loadWindowState();

  const validateSender = (event: Electron.IpcMainInvokeEvent) => {
    const url = event.senderFrame?.url;
    const devUrl = typeof MAIN_WINDOW_VITE_DEV_SERVER_URL !== 'undefined' ? MAIN_WINDOW_VITE_DEV_SERVER_URL : null;
    if (devUrl && url?.startsWith(devUrl)) return;
    if (url?.startsWith('file://')) return;
    throw new Error(`Unauthorized IPC sender: ${url}`);
  };

  ipcMain.handle('app:get-info', (event) => {
    validateSender(event);
    return {
      version: app.getVersion(),
      state: cachedState
    };
  });
  
  ipcMain.handle('app:ping', (event): string => {
    validateSender(event);
    return 'pong';
  });
  
  const isMac = process.platform === 'darwin';
  const menu = buildMenu(isMac);
  Menu.setApplicationMenu(menu);

  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
