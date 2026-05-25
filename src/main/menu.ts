import { app, Menu, MenuItemConstructorOptions, shell, MenuItem, BrowserWindow } from 'electron';

const isDev = !app.isPackaged;

export function buildMenu(isMac: boolean): Menu {
  const template: MenuItemConstructorOptions[] = [
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' as const },
        { type: 'separator' as const },
        {
          label: 'Preferences',
          accelerator: 'CmdOrCtrl+,',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          click: (_item: MenuItem, focusedWindow: any) => {
            const win = focusedWindow || BrowserWindow.getAllWindows()[0];
            if (win && win.webContents) win.webContents.send('menu:preferences');
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          click: (_item: MenuItem, focusedWindow: any) => {
            const win = focusedWindow || BrowserWindow.getAllWindows()[0];
            if (win && win.webContents) win.webContents.send('menu:new-project');
          }
        },
        ...(isMac ? [] : [
          { type: 'separator' as const },
          {
            label: 'Preferences',
            accelerator: 'Ctrl+,',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            click: (_item: MenuItem, focusedWindow: any) => {
              const win = focusedWindow || BrowserWindow.getAllWindows()[0];
              if (win && win.webContents) win.webContents.send('menu:preferences');
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
        ...(isDev ? [
          { role: 'reload' as const },
          { role: 'forceReload' as const },
          { role: 'toggleDevTools' as const },
          { type: 'separator' as const }
        ] : []),
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
            await shell.openExternal('https://github.com/RisoTron/RisoTron-Studio');
          }
        }
      ]
    }
  ];

  return Menu.buildFromTemplate(template);
}
