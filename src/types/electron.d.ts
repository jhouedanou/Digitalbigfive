interface ElectronAPI {
  getVersion: () => Promise<string>;
  getPlatform: () => Promise<string>;
  navigate: (path: string) => void;
  onOnlineStatus: (callback: (online: boolean) => void) => () => void;
  onUpdateAvailable: (
    callback: (info: { version: string }) => void
  ) => () => void;
  onUpdateDownloaded: (
    callback: (info: { version: string }) => void
  ) => () => void;
  installUpdate: () => void;
  minimize: () => void;
  maximize: () => void;
  close: () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
