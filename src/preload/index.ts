import { contextBridge, ipcRenderer } from 'electron';

// Expose a minimal API to the renderer process.
contextBridge.exposeInMainWorld('api', {
  getAppInfo: () => ipcRenderer.invoke('app:get-info'),
  ping: () => ipcRenderer.invoke('app:ping'),
  testDb: () => ipcRenderer.invoke('app:test-db'),
  onMenuNewProject: (callback: () => void) => {
    if (typeof callback !== 'function') return () => { /* noop */ };
    const handler = () => callback();
    ipcRenderer.on('menu:new-project', handler);
    return () => ipcRenderer.removeListener('menu:new-project', handler);
  },
  onMenuPreferences: (callback: () => void) => {
    if (typeof callback !== 'function') return () => { /* noop */ };
    const handler = () => callback();
    ipcRenderer.on('menu:preferences', handler);
    return () => ipcRenderer.removeListener('menu:preferences', handler);
  }
});
