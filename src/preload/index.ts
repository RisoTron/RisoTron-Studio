import { contextBridge, ipcRenderer } from 'electron';

// Expose a minimal API to the renderer process.
contextBridge.exposeInMainWorld('api', {
  getAppInfo: () => ipcRenderer.invoke('app:get-info'),
  ping: () => ipcRenderer.invoke('app:ping'),
});
