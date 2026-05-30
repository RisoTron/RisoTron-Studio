import { contextBridge, ipcRenderer } from 'electron';

// Expose a minimal API to the renderer process.
contextBridge.exposeInMainWorld('api', {
  getAppInfo: () => ipcRenderer.invoke('app:get-info'),
  ping: () => ipcRenderer.invoke('app:ping'),
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
  },
  settings: {
    getAll: () => ipcRenderer.invoke('app:get-settings'),
    get: (key: string) => ipcRenderer.invoke('app:get-setting', key),
    set: (key: string, value: unknown) => ipcRenderer.invoke('app:set-setting', key, value),
  },
  project: {
    create: (payload: Record<string, unknown>) => ipcRenderer.invoke('app:create-project', payload),
    list: async (includeArchived?: boolean) => {
      const result = await ipcRenderer.invoke('app:list-projects', includeArchived);
      if (result?.success) return result.data;
      throw new Error(result?.error ?? 'Failed to list projects');
    },
    get: (id: string) => ipcRenderer.invoke('app:get-project', id),
    update: (id: string, payload: Record<string, unknown>) => ipcRenderer.invoke('app:update-project', id, payload),
    delete: (id: string) => ipcRenderer.invoke('app:delete-project', id),
  },
});
