import { contextBridge, ipcRenderer } from 'electron';

// Expose a minimal API to the renderer process.
contextBridge.exposeInMainWorld('api', {
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),
  ping: () => ipcRenderer.invoke('ping'),
});
