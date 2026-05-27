export {};

import type { WindowState } from '../main/utils/window-state';
import type { AppSettings } from '../shared/types/settings';

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
    };
  }
}

