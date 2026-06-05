import { app, BrowserWindow, nativeTheme, ipcMain, Menu, dialog, shell, safeStorage } from 'electron';
import { buildMenu } from './menu';
import path from 'node:path';
import { exec } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import started from 'electron-squirrel-startup';
import { loadWindowState, trackWindowState, MIN_WIDTH, MIN_HEIGHT } from './utils/window-state';
import { db } from './db';
import { ConfigService } from './services/ConfigService';
import { ProjectRepository } from './services/ProjectRepository';
import { VALID_SETTING_KEYS } from '../shared/types/settings';
import type { AppSettings } from '../shared/types/settings';
import type { CreateProjectPayload, UpdateProjectPayload, Project } from '../shared/types/project';
import type { PipelineContext, IProvider } from '../shared/types/pipeline';
import type { AddCredentialArgs, AddCredentialResult, CredentialError, CredentialListItem, CredentialType } from '../shared/types/credential';
import { PipelineEngine } from './services/pipeline/PipelineEngine';
import { BaseProjectProvider } from './services/pipeline/providers/BaseProjectProvider';
import { ForgeProvider } from './services/pipeline/providers/ForgeProvider';
import { ReleaseProvider } from './services/pipeline/providers/ReleaseProvider';
import { CICDProvider } from './services/pipeline/providers/CICDProvider';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

/**
 * Select the appropriate scaffold provider based on the project template_id.
 * Defaults to ForgeProvider for all Electron Forge-based templates.
 * New providers (e.g. RisotronProvider) will be added here as they are implemented.
 */
function buildScaffoldProvider(templateId: string | undefined): IProvider {
  switch (templateId) {
    // Future: case 'risotron': return new RisotronProvider();
    case 'electron-svelte':
    case 'electron-react':
    case 'electron-vanilla':
    default:
      return new ForgeProvider();
  }
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

    ipcMain.handle('app:create-project', async (event, payload: unknown) => {
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

        // ── Build pipeline ──
        const engine = new PipelineEngine();
        engine.registerProvider(new BaseProjectProvider());
        engine.registerProvider(buildScaffoldProvider(createPayload.template_id));
        engine.registerProvider(new ReleaseProvider());
        engine.registerProvider(new CICDProvider());

        const context: PipelineContext = {
          createPayload,
          projectRepo,
        };

        await engine.run(context, (progress) => {
          if (!event.sender.isDestroyed()) {
            event.sender.send('app:scaffold-progress', progress);
          }
        });

        const project = context['project'] as Project | undefined;
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
      } catch (e: unknown) {
        return { success: false, error: e instanceof Error ? e.message : String(e) };
      }
    });

    ipcMain.handle('os:open-in-ide', async (event, itemPath: string) => {
      validateSender(event);
      try {
        if (typeof itemPath !== 'string' || itemPath.trim() === '') {
          return { success: false, error: 'Invalid path' };
        }
        const ideCommand = configService.getSetting('preferredIDE') as string || 'code';
        return new Promise((resolve) => {
          exec(`${ideCommand} "${itemPath}"`, (error) => {
            if (error) {
              resolve({ success: false, error: error.message });
            } else {
              resolve({ success: true });
            }
          });
        });
      } catch (e: unknown) {
        return { success: false, error: e instanceof Error ? e.message : String(e) };
      }
    });

    function getMasked(type: CredentialType): string {
      switch (type) {
        case 'github-pat':    return 'ghp_****';
        case 'aws':           return 'AKIA****';
        case 'generic-token': return '****';
        default:              return '****';
      }
    }

    // ── Credential IPC ────────────────────────────────────────────
    ipcMain.handle('credential:add', async (event, args: unknown) => {
      try {
        validateSender(event);

        // Runtime shape validation (IPC is untrusted boundary)
        if (
          !args ||
          typeof args !== 'object' ||
          typeof (args as Record<string, unknown>).name !== 'string' ||
          typeof (args as Record<string, unknown>).type !== 'string' ||
          typeof (args as Record<string, unknown>).payload !== 'object' ||
          (args as Record<string, unknown>).payload === null
        ) {
          return { success: false, error: { code: 'VALIDATION_ERROR', message: 'Malformed request' } as CredentialError };
        }

        const typedArgs = args as { name: string; type: string; payload: Record<string, unknown> };

        // Validate type against allowlist
        const VALID_TYPES: CredentialType[] = ['github-pat', 'aws', 'generic-token'];
        if (!VALID_TYPES.includes(typedArgs.type as CredentialType)) {
          return { success: false, error: { code: 'VALIDATION_ERROR', field: 'type', message: 'Invalid credential type' } as CredentialError };
        }

        const credType = typedArgs.type as CredentialType;

        if (!safeStorage.isEncryptionAvailable()) {
          return { success: false, error: { code: 'ENCRYPTION_UNAVAILABLE', message: 'Encryption is not available on this system.' } as CredentialError };
        }

        // Validate name
        const name = typedArgs.name.trim();
        if (!name) {
          return { success: false, error: { code: 'VALIDATION_ERROR', field: 'name', message: 'Name is required' } as CredentialError };
        }
        if (name.length > 100) {
          return { success: false, error: { code: 'VALIDATION_ERROR', field: 'name', message: 'Name must be 100 characters or fewer' } as CredentialError };
        }

        // Type-aware payload validation with explicit field allowlist and length limits
        let validatedPayload: AddCredentialArgs['payload'];
        if (credType === 'aws') {
          const { accessKeyId, secretAccessKey } = typedArgs.payload as Record<string, unknown>;
          if (typeof accessKeyId !== 'string' || !accessKeyId.trim()) {
            return { success: false, error: { code: 'VALIDATION_ERROR', field: 'accessKeyId', message: 'Access Key ID is required' } as CredentialError };
          }
          if (accessKeyId.trim().length > 40) {
            return { success: false, error: { code: 'VALIDATION_ERROR', field: 'accessKeyId', message: 'Access Key ID is too long' } as CredentialError };
          }
          if (typeof secretAccessKey !== 'string' || !secretAccessKey.trim()) {
            return { success: false, error: { code: 'VALIDATION_ERROR', field: 'secretAccessKey', message: 'Secret Access Key is required' } as CredentialError };
          }
          if (secretAccessKey.trim().length > 512) {
            return { success: false, error: { code: 'VALIDATION_ERROR', field: 'secretAccessKey', message: 'Secret Access Key is too long' } as CredentialError };
          }
          validatedPayload = { accessKeyId: accessKeyId.trim(), secretAccessKey: secretAccessKey.trim() };
        } else {
          // github-pat and generic-token
          const { value } = typedArgs.payload as Record<string, unknown>;
          if (typeof value !== 'string' || !value.trim()) {
            return { success: false, error: { code: 'VALIDATION_ERROR', field: 'value', message: 'Token value is required' } as CredentialError };
          }
          if (value.trim().length > 512) {
            return { success: false, error: { code: 'VALIDATION_ERROR', field: 'value', message: 'Token value is too long' } as CredentialError };
          }
          validatedPayload = { value: value.trim() };
        }

        // Encrypt validated payload
        const json = JSON.stringify(validatedPayload);
        const encryptedBuffer = safeStorage.encryptString(json);

        // Build masked value
        let masked = '****';
        if (credType === 'aws') {
          masked = (validatedPayload as { accessKeyId: string }).accessKeyId.substring(0, 4) + '****';
        }

        // Generate timestamp in JS to avoid SELECT-after-INSERT
        const created_at = new Date().toISOString().replace('T', ' ').split('.')[0] + ' UTC';

        // Insert
        let insertId: number;
        try {
          const result = db.execute(
            `INSERT INTO credentials (name, type, encrypted_payload, created_at) VALUES (?, ?, ?, ?)`,
            [name, credType, encryptedBuffer, created_at]
          );
          insertId = result.lastInsertRowid as number;
        } catch (sqlErr: unknown) {
          const msg = sqlErr instanceof Error ? sqlErr.message : String(sqlErr);
          if (msg.includes('UNIQUE constraint failed')) {
            return { success: false, error: { code: 'DUPLICATE_NAME', field: 'name', message: 'Credential name already exists' } as CredentialError };
          }
          return { success: false, error: { code: 'VALIDATION_ERROR', message: 'Failed to save credential' } as CredentialError };
        }

        const data: AddCredentialResult = { id: insertId, name, type: credType, masked, created_at };
        return { success: true, data };
      } catch (err: unknown) {
        // Log internally but don't expose system details to renderer
        console.error('[credential:add] Unexpected error:', err);
        return { success: false, error: { code: 'VALIDATION_ERROR', message: 'An unexpected error occurred' } as CredentialError };
      }
    });

    ipcMain.handle('credential:list', async (event) => {
      try {
        validateSender(event);
        const rows = db.prepare(
          'SELECT id, name, type, created_at FROM credentials ORDER BY created_at DESC'
        ).all() as Array<{ id: number; name: string; type: string; created_at: string }>;

        const data: CredentialListItem[] = rows.map((row) => ({
          id: row.id,
          name: row.name,
          type: row.type as CredentialType,
          masked: getMasked(row.type as CredentialType),
          created_at: row.created_at,
          linked_server_count: 0,
        }));

        return { success: true, data };
      } catch (err: unknown) {
        console.error('[credential:list] Error:', err);
        return { success: false, error: { code: 'QUERY_ERROR', message: 'Failed to list credentials' } as CredentialError };
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
