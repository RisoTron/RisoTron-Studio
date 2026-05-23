import { contextBridge } from 'electron';

// Expose a minimal API to the renderer process.
// This will be expanded in US 23 (IPC Bridge).
contextBridge.exposeInMainWorld('api', {});
