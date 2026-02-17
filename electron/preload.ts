import { contextBridge, ipcRenderer } from "electron";

// ─── Expose APIs to renderer ────────────────────────────────
contextBridge.exposeInMainWorld("electronAPI", {
  // Config
  getConfig: () => ipcRenderer.invoke("get-config"),

  // Navigation
  navigate: (page: string) => ipcRenderer.send("navigate", page),
  navigateReader: (bookId: string, title: string) =>
    ipcRenderer.send("navigate-reader", bookId, title),

  // PDF Storage
  downloadPdf: (bookId: string, accessToken: string) =>
    ipcRenderer.invoke("download-pdf", bookId, accessToken),
  readLocalPdf: (bookId: string) =>
    ipcRenderer.invoke("read-local-pdf", bookId),
  isPdfDownloaded: (bookId: string) =>
    ipcRenderer.invoke("is-pdf-downloaded", bookId),
  deletePdf: (bookId: string) =>
    ipcRenderer.invoke("delete-pdf", bookId),
  listDownloadedPdfs: () =>
    ipcRenderer.invoke("list-downloaded-pdfs"),
  getStorageInfo: () =>
    ipcRenderer.invoke("get-storage-info"),
  openStorageFolder: () =>
    ipcRenderer.send("open-storage-folder"),

  // Events from main
  onOpenBook: (callback: (data: { bookId: string; title: string }) => void) =>
    ipcRenderer.on("open-book", (_event, data) => callback(data)),
  onAppConfig: (callback: (config: Record<string, string>) => void) =>
    ipcRenderer.on("app-config", (_event, config) => callback(config)),
  onUpdateDownloaded: (callback: (info: { version: string }) => void) =>
    ipcRenderer.on("update-downloaded", (_event, info) => callback(info)),
  installUpdate: () => ipcRenderer.send("install-update"),
});
