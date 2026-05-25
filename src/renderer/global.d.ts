export {};

import type { WindowState } from '../main/utils/window-state';

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
    };
  }
}
