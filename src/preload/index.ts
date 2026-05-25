import { contextBridge, ipcRenderer } from 'electron';

// Expose a minimal API to the renderer process.
// This will be expanded in US 23 (IPC Bridge).
contextBridge.exposeInMainWorld('api', {
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),
});
