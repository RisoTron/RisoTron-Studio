export {};

declare global {
  interface AppInfo {
    version: string;
    state: Record<string, any>;
  }

  interface Window {
    api: {
      getAppInfo: () => Promise<AppInfo>;
      ping: () => Promise<string>;
    };
  }
}
