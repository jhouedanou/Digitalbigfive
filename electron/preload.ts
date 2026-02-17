import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  // App info
  getVersion: () => ipcRenderer.invoke("app:get-version"),
  getPlatform: () => ipcRenderer.invoke("app:get-platform"),

  // Navigation
  navigate: (path: string) => ipcRenderer.send("navigate", path),

  // Online/offline status
  onOnlineStatus: (callback: (online: boolean) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, online: boolean) =>
      callback(online);
    ipcRenderer.on("online-status", handler);
    return () => ipcRenderer.removeListener("online-status", handler);
  },

  // Auto-update
  onUpdateAvailable: (callback: (info: { version: string }) => void) => {
    const handler = (
      _event: Electron.IpcRendererEvent,
      info: { version: string }
    ) => callback(info);
    ipcRenderer.on("update-available", handler);
    return () => ipcRenderer.removeListener("update-available", handler);
  },
  onUpdateDownloaded: (callback: (info: { version: string }) => void) => {
    const handler = (
      _event: Electron.IpcRendererEvent,
      info: { version: string }
    ) => callback(info);
    ipcRenderer.on("update-downloaded", handler);
    return () => ipcRenderer.removeListener("update-downloaded", handler);
  },
  installUpdate: () => ipcRenderer.send("install-update"),

  // Window controls
  minimize: () => ipcRenderer.send("window:minimize"),
  maximize: () => ipcRenderer.send("window:maximize"),
  close: () => ipcRenderer.send("window:close"),
});
