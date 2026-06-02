export {};

import type { WindowState } from '../main/utils/window-state';
import type { AppSettings } from '../shared/types/settings';
import type { Project } from '../shared/types/project';

declare global {
  interface AppInfo {
    version: string;
    state: WindowState;
  }

  interface Window {
    api: {
      getAppInfo: () => Promise<AppInfo>;
      ping: () => Promise<string>;
      onMenuNewProject: (callback: () => void) => () => void;
      onMenuPreferences: (callback: () => void) => () => void;
      settings: {
        getAll: () => Promise<AppSettings>;
        get: <K extends keyof AppSettings>(key: K) => Promise<AppSettings[K]>;
        set: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => Promise<void>;
      };
      project: {
        list: (includeArchived?: boolean) => Promise<Project[]>;
        create: (payload: Record<string, unknown>) => Promise<{ success: boolean; data?: Project; error?: string }>;
        get: (id: string) => Promise<{ success: boolean; data?: Project; error?: string }>;
        update: (id: string, payload: Record<string, unknown>) => Promise<{ success: boolean; data?: Project; error?: string }>;
        delete: (id: string) => Promise<{ success: boolean; data?: Project; error?: string }>;
      };
      os: {
        showItemInFolder: (path: string) => Promise<void>;
        openInIDE: (path: string) => Promise<void>;
      };
    };
  }
}

