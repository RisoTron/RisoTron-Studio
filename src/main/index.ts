import { app, BrowserWindow, nativeTheme, ipcMain, Menu, MenuItemConstructorOptions } from 'electron';
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

  const template: MenuItemConstructorOptions[] = [
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' as const },
        { type: 'separator' as const },
        {
          label: 'Preferences',
          accelerator: 'CmdOrCtrl+,',
          click: (item: any, focusedWindow: any) => {
            if (focusedWindow && focusedWindow.webContents) {
              focusedWindow.webContents.send('menu:preferences');
            }
          }
        },
        { type: 'separator' as const },
        { role: 'services' as const },
        { type: 'separator' as const },
        { role: 'hide' as const },
        { role: 'hideOthers' as const },
        { role: 'unhide' as const },
        { type: 'separator' as const },
        { role: 'quit' as const }
      ]
    }] : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'New Project',
          accelerator: 'CmdOrCtrl+N',
          click: (item: any, focusedWindow: any) => {
            if (focusedWindow && focusedWindow.webContents) {
              focusedWindow.webContents.send('menu:new-project');
            }
          }
        },
        ...(isMac ? [] : [
          { type: 'separator' as const },
          {
            label: 'Preferences',
            accelerator: 'Ctrl+,',
            click: (item: any, focusedWindow: any) => {
              if (focusedWindow && focusedWindow.webContents) {
                focusedWindow.webContents.send('menu:preferences');
              }
            }
          }
        ]),
        { type: 'separator' as const },
        isMac ? { role: 'close' as const } : { role: 'quit' as const }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' as const },
        { role: 'redo' as const },
        { type: 'separator' as const },
        { role: 'cut' as const },
        { role: 'copy' as const },
        { role: 'paste' as const },
        ...(isMac ? [
          { role: 'pasteAndMatchStyle' as const },
          { role: 'delete' as const },
          { role: 'selectAll' as const },
          { type: 'separator' as const },
          {
            label: 'Speech',
            submenu: [
              { role: 'startSpeaking' as const },
              { role: 'stopSpeaking' as const }
            ]
          }
        ] : [
          { role: 'delete' as const },
          { type: 'separator' as const },
          { role: 'selectAll' as const }
        ])
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' as const },
        { role: 'forceReload' as const },
        { role: 'toggleDevTools' as const },
        { type: 'separator' as const },
        { role: 'resetZoom' as const },
        { role: 'zoomIn' as const },
        { role: 'zoomOut' as const },
        { type: 'separator' as const },
        { role: 'togglefullscreen' as const }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' as const },
        { role: 'zoom' as const },
        ...(isMac ? [
          { type: 'separator' as const },
          { role: 'front' as const },
          { type: 'separator' as const },
          { role: 'window' as const }
        ] : [
          { role: 'close' as const }
        ])
      ]
    },
    {
      role: 'help' as const,
      submenu: [
        {
          label: 'Learn More',
          click: async () => {
            const { shell } = require('electron');
            await shell.openExternal('https://github.com/RisoTron/RisoTron-Studio');
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
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
