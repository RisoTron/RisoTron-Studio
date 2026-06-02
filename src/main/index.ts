import { app, BrowserWindow, nativeTheme, ipcMain, Menu, dialog, shell } from 'electron';
import { buildMenu } from './menu';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import started from 'electron-squirrel-startup';
import { loadWindowState, trackWindowState, MIN_WIDTH, MIN_HEIGHT } from './utils/window-state';
import { db } from './db';
import { ConfigService } from './services/ConfigService';
import { ProjectRepository } from './services/ProjectRepository';
import { VALID_SETTING_KEYS } from '../shared/types/settings';
import type { AppSettings } from '../shared/types/settings';
import type { CreateProjectPayload, UpdateProjectPayload } from '../shared/types/project';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

// Single-instance lock — only one Studio window at a time.
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const win = BrowserWindow.getAllWindows()[0];
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

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

  app.on('before-quit', () => {
    db.close();
  });

  app.whenReady().then(() => {
    try {
      db.initialize();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      dialog.showErrorBox('Database Error', message);
      app.quit();
      return;
    }

    const cachedState = loadWindowState();

    const validateSender = (event: Electron.IpcMainInvokeEvent) => {
      const url = event.senderFrame?.url;
      const devUrl = typeof MAIN_WINDOW_VITE_DEV_SERVER_URL !== 'undefined' ? MAIN_WINDOW_VITE_DEV_SERVER_URL : null;
      if (devUrl && url?.startsWith(devUrl)) return;
      if (url?.startsWith('file://' + path.join(__dirname, '../renderer/'))) return;
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

    // ── Settings IPC ─────────────────────────────────────────────
    const configService = new ConfigService(db);

    ipcMain.handle('app:get-settings', (event) => {
      validateSender(event);
      return configService.getAllSettings();
    });

    ipcMain.handle('app:get-setting', (event, key: string) => {
      validateSender(event);
      if (!VALID_SETTING_KEYS.includes(key as keyof AppSettings)) {
        throw new Error(`Invalid setting key: ${key}`);
      }
      return configService.getSetting(key as keyof AppSettings);
    });

    ipcMain.handle('app:set-setting', (event, key: string, value: unknown) => {
      validateSender(event);
      if (!VALID_SETTING_KEYS.includes(key as keyof AppSettings)) {
        throw new Error(`Invalid setting key: ${key}`);
      }
      configService.setSetting(key as keyof AppSettings, value as AppSettings[keyof AppSettings]);
    });

    // ── Project IPC ──────────────────────────────────────────────
    const projectRepo = new ProjectRepository(db);

    ipcMain.handle('app:create-project', (event, payload: unknown) => {
      validateSender(event);
      try {
        if (!payload || typeof payload !== 'object') {
          return { success: false, error: 'Invalid payload: expected an object.' };
        }
        const p = payload as Record<string, unknown>;
        if (typeof p.name !== 'string' || p.name.trim() === '' || p.name.length > 255) {
          return { success: false, error: 'Invalid payload: "name" is required and must be a non-empty string under 255 chars.' };
        }
        if (typeof p.path !== 'string' || p.path.trim() === '') {
          return { success: false, error: 'Invalid payload: "path" is required and must be a non-empty string.' };
        }
        const trimmedPath = p.path.trim();
        if (!path.isAbsolute(trimmedPath)) {
          return { success: false, error: 'Invalid payload: "path" must be an absolute path.' };
        }
        if (path.normalize(trimmedPath) !== trimmedPath) {
          return { success: false, error: 'Invalid payload: "path" must be normalized.' };
        }
        if (p.template_id !== undefined && typeof p.template_id !== 'string') {
          return { success: false, error: 'Invalid payload: "template_id" must be a string if provided.' };
        }
        if (p.providers !== undefined && (!Array.isArray(p.providers) || !p.providers.every(x => typeof x === 'string'))) {
          return { success: false, error: 'Invalid payload: "providers" must be an array of strings if provided.' };
        }
        const createPayload: CreateProjectPayload = {
          name: p.name.trim(),
          path: trimmedPath,
          template_id: p.template_id as string | undefined,
          providers: p.providers as string[] | undefined,
        };
        fs.mkdirSync(trimmedPath, { recursive: true });
        fs.writeFileSync(
          path.join(trimmedPath, 'risotron.json'),
          JSON.stringify(createPayload, null, 2),
        );
        const project = projectRepo.create(createPayload);
        return { success: true, data: project };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return { success: false, error: message };
      }
    });

    ipcMain.handle('app:list-projects', (event, includeArchived?: unknown) => {
      validateSender(event);
      try {
        const archived = typeof includeArchived === 'boolean' ? includeArchived : false;
        const projects = projectRepo.list(archived);
        return { success: true, data: projects };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return { success: false, error: message };
      }
    });

    ipcMain.handle('app:get-project', (event, id: unknown) => {
      validateSender(event);
      try {
        if (typeof id !== 'string' || id.trim() === '') {
          return { success: false, error: 'Invalid argument: "id" must be a non-empty string.' };
        }
        const project = projectRepo.get(id);
        if (!project) {
          return { success: false, error: `Project not found: ${id}` };
        }
        return { success: true, data: project };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return { success: false, error: message };
      }
    });

    ipcMain.handle('app:update-project', (event, id: unknown, payload: unknown) => {
      validateSender(event);
      try {
        if (typeof id !== 'string' || id.trim() === '') {
          return { success: false, error: 'Invalid argument: "id" must be a non-empty string.' };
        }
        if (!payload || typeof payload !== 'object') {
          return { success: false, error: 'Invalid payload: expected an object.' };
        }
        const p = payload as Record<string, unknown>;
        const updatePayload: UpdateProjectPayload = {};
        if (p.name !== undefined) {
          if (typeof p.name !== 'string' || p.name.trim() === '' || p.name.length > 255) return { success: false, error: 'Invalid name' };
          updatePayload.name = p.name;
        }
        if (p.path !== undefined) {
          if (typeof p.path !== 'string' || p.path.trim() === '') return { success: false, error: 'Invalid path' };
          updatePayload.path = p.path;
        }
        if (p.template_id !== undefined) {
          if (p.template_id !== null && typeof p.template_id !== 'string') return { success: false, error: 'Invalid template_id' };
          updatePayload.template_id = p.template_id as string | null;
        }
        if (p.providers !== undefined) {
          if (!Array.isArray(p.providers) || !p.providers.every(x => typeof x === 'string')) return { success: false, error: 'Invalid providers' };
          updatePayload.providers = p.providers as string[];
        }
        const project = projectRepo.update(id, updatePayload);
        if (!project) {
          return { success: false, error: `Project not found: ${id}` };
        }
        return { success: true, data: project };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return { success: false, error: message };
      }
    });

    ipcMain.handle('app:delete-project', (event, id: unknown) => {
      validateSender(event);
      try {
        if (typeof id !== 'string' || id.trim() === '') {
          return { success: false, error: 'Invalid argument: "id" must be a non-empty string.' };
        }
        const project = projectRepo.softDelete(id);
        if (!project) {
          return { success: false, error: `Project not found: ${id}` };
        }
        return { success: true, data: project };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return { success: false, error: message };
      }
    });

    ipcMain.handle('os:show-item-in-folder', (event, itemPath: string) => {
      validateSender(event);
      try {
        if (typeof itemPath !== 'string' || itemPath.trim() === '') {
          return { success: false, error: 'Invalid path' };
        }
        shell.showItemInFolder(itemPath);
        return { success: true };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    });

    ipcMain.handle('os:open-in-ide', async (event, itemPath: string) => {
      validateSender(event);
      try {
        if (typeof itemPath !== 'string' || itemPath.trim() === '') {
          return { success: false, error: 'Invalid path' };
        }
        await shell.openExternal('vscode://file/' + encodeURI(itemPath));
        return { success: true };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
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
}
