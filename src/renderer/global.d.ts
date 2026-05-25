export {};

declare global {
  interface Window {
    api: {
      getAppInfo: () => Promise<any>;
    };
  }
}
