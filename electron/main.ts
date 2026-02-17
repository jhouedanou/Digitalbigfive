import {
  app,
  BrowserWindow,
  Tray,
  Menu,
  nativeImage,
  ipcMain,
  shell,
} from "electron";
import { autoUpdater } from "electron-updater";
import log from "electron-log";
import * as path from "path";
import * as fs from "fs";

console.log("[MAIN] Starting Big Five Digital Electron App...");
console.log("[MAIN] __dirname:", __dirname);
console.log("[MAIN] app.isPackaged:", app.isPackaged);

// ─── Configuration ──────────────────────────────────────────
log.transports.file.level = "info";
autoUpdater.logger = log;

const PROTOCOL = "bigfive";
const API_URL_PROD = "https://digitalbigfive.vercel.app";
const API_URL_DEV = "http://localhost:3000";

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;

// ─── Paths ──────────────────────────────────────────────────
function getApiUrl(): string {
  return app.isPackaged ? API_URL_PROD : API_URL_DEV;
}

function getRendererPath(file: string): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "renderer", file);
  }
  return path.join(__dirname, "..", "renderer", file);
}

function getPreloadPath(): string {
  return path.join(__dirname, "preload.js");
}

function getIconPath(name: string): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "assets", name);
  }
  return path.join(__dirname, "assets", name);
}

function getPdfsDir(): string {
  const dir = path.join(app.getPath("userData"), "pdfs");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

// ─── Environment variables ──────────────────────────────────
// Public Supabase credentials (anon/publishable key) — safe to embed in client code.
// These are protected by Row-Level Security on the Supabase side.
const SUPABASE_URL = "https://jqsyxftdargaottivpeh.supabase.co";
const SUPABASE_ANON_KEY =
  "sb_publishable_Gfv70fHn_PBjuLN_cakNoQ_8CQVb7E1";

function loadEnvConfig(): { supabaseUrl: string; supabaseKey: string } {
  // In packaged mode, use the embedded public credentials directly
  if (app.isPackaged) {
    return {
      supabaseUrl: SUPABASE_URL,
      supabaseKey: SUPABASE_ANON_KEY,
    };
  }

  // In development, try to read from .env.local first
  try {
    const envPath = path.join(__dirname, "..", "..", ".env.local");
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, "utf-8");
      const vars: Record<string, string> = {};
      envContent.split("\n").forEach((line) => {
        const match = line.match(/^([^#=]+)=(.*)$/);
        if (match) {
          vars[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, "");
        }
      });
      if (vars.NEXT_PUBLIC_SUPABASE_URL && vars.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY) {
        return {
          supabaseUrl: vars.NEXT_PUBLIC_SUPABASE_URL,
          supabaseKey: vars.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
        };
      }
    }
  } catch (err) {
    log.error("Failed to read .env.local:", err);
  }

  // Fallback to embedded credentials
  return {
    supabaseUrl: SUPABASE_URL,
    supabaseKey: SUPABASE_ANON_KEY,
  };
}

// ─── Window ─────────────────────────────────────────────────
function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    icon: getIconPath(process.platform === "win32" ? "icon.ico" : "icon.png"),
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: false, // Required: file:// origin needs to fetch Supabase APIs
    },
    show: false,
    backgroundColor: "#1c1c1e",
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    autoHideMenuBar: true,
    title: "Big Five Digital",
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  // Load login page
  mainWindow.loadFile(getRendererPath("login.html"));

  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools({ mode: "detach" });
  }

  // Forward renderer console messages to terminal for debugging
  mainWindow.webContents.on("console-message", (_event, level, message, line, sourceId) => {
    const tag = ["LOG", "WARN", "ERROR"][level] || "LOG";
    console.log(`[RENDERER:${tag}] ${message}`);
  });

  mainWindow.on("close", (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Block external navigation — allow only local file:// and Supabase URLs
  mainWindow.webContents.on("will-navigate", (event, url) => {
    const parsed = new URL(url);
    // Allow local file navigation and Supabase auth endpoints
    if (parsed.protocol === "file:") return;
    if (parsed.hostname.endsWith(".supabase.co")) return;
    log.warn(`[MAIN] Blocked navigation to: ${url}`);
    event.preventDefault();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

// ─── IPC ────────────────────────────────────────────────────
function setupIPC(): void {
  const envConfig = loadEnvConfig();

  ipcMain.handle("get-config", () => ({
    apiUrl: getApiUrl(),
    supabaseUrl: envConfig.supabaseUrl,
    supabaseKey: envConfig.supabaseKey,
    version: app.getVersion(),
    platform: process.platform,
  }));

  // ─── Navigation ───────────────────────────────────────────
  ipcMain.on("navigate", (_event, page: string) => {
    const filePath = getRendererPath(page);
    if (fs.existsSync(filePath)) {
      mainWindow?.loadFile(filePath);
    }
  });

  ipcMain.on("navigate-reader", (_event, bookId: string, title: string) => {
    mainWindow?.loadFile(getRendererPath("reader.html"));
    mainWindow?.webContents.once("did-finish-load", () => {
      mainWindow?.webContents.send("open-book", { bookId, title });
    });
  });

  // ─── PDF Local Storage ────────────────────────────────────
  ipcMain.handle(
    "download-pdf",
    async (_event, bookId: string, accessToken: string) => {
      try {
        const apiUrl = getApiUrl();
        const response = await fetch(`${apiUrl}/api/pdf/${bookId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const buffer = Buffer.from(await response.arrayBuffer());
        const filePath = path.join(getPdfsDir(), `${bookId}.pdf`);
        fs.writeFileSync(filePath, buffer);

        log.info(`PDF saved: ${bookId} (${buffer.length} bytes)`);
        return { success: true, path: filePath, size: buffer.length };
      } catch (err) {
        log.error(`PDF download failed: ${bookId}`, err);
        return {
          success: false,
          error: err instanceof Error ? err.message : "Erreur de téléchargement",
        };
      }
    }
  );

  ipcMain.handle("read-local-pdf", async (_event, bookId: string) => {
    try {
      const filePath = path.join(getPdfsDir(), `${bookId}.pdf`);
      if (!fs.existsSync(filePath)) {
        return { success: false, error: "PDF non trouvé localement" };
      }
      const data = fs.readFileSync(filePath);
      // Return as Uint8Array for the renderer
      return { success: true, data: new Uint8Array(data) };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Erreur de lecture",
      };
    }
  });

  ipcMain.handle("is-pdf-downloaded", (_event, bookId: string) => {
    const filePath = path.join(getPdfsDir(), `${bookId}.pdf`);
    if (!fs.existsSync(filePath)) return { downloaded: false };
    const stats = fs.statSync(filePath);
    return {
      downloaded: true,
      size: stats.size,
      downloadedAt: stats.mtime.toISOString(),
    };
  });

  ipcMain.handle("delete-pdf", (_event, bookId: string) => {
    try {
      const filePath = path.join(getPdfsDir(), `${bookId}.pdf`);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Erreur" };
    }
  });

  ipcMain.handle("list-downloaded-pdfs", () => {
    try {
      const dir = getPdfsDir();
      return fs
        .readdirSync(dir)
        .filter((f) => f.endsWith(".pdf"))
        .map((f) => {
          const stats = fs.statSync(path.join(dir, f));
          return {
            bookId: f.replace(".pdf", ""),
            size: stats.size,
            downloadedAt: stats.mtime.toISOString(),
          };
        });
    } catch {
      return [];
    }
  });

  ipcMain.handle("get-storage-info", () => {
    try {
      const dir = getPdfsDir();
      const files = fs.readdirSync(dir).filter((f) => f.endsWith(".pdf"));
      let totalSize = 0;
      files.forEach((f) => {
        totalSize += fs.statSync(path.join(dir, f)).size;
      });
      return {
        path: dir,
        count: files.length,
        totalSizeMB: Math.round((totalSize / (1024 * 1024)) * 100) / 100,
      };
    } catch {
      return { path: getPdfsDir(), count: 0, totalSizeMB: 0 };
    }
  });

  ipcMain.on("open-storage-folder", () => {
    shell.openPath(getPdfsDir());
  });

  ipcMain.on("install-update", () => {
    isQuitting = true;
    autoUpdater.quitAndInstall();
  });
}

// ─── Tray ───────────────────────────────────────────────────
function createTray(): void {
  const trayIconPath = getIconPath("tray-icon.png");
  if (!fs.existsSync(trayIconPath)) return;

  const icon = nativeImage.createFromPath(trayIconPath);
  tray = new Tray(icon);

  tray.setToolTip("Big Five Digital");
  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: "Ouvrir",
        click: () => {
          mainWindow?.show();
          mainWindow?.focus();
        },
      },
      { type: "separator" },
      {
        label: "Ma Bibliothèque",
        click: () => {
          mainWindow?.show();
          mainWindow?.focus();
          mainWindow?.loadFile(getRendererPath("library.html"));
        },
      },
      { type: "separator" },
      {
        label: "Quitter",
        click: () => {
          isQuitting = true;
          app.quit();
        },
      },
    ])
  );

  tray.on("double-click", () => {
    mainWindow?.show();
    mainWindow?.focus();
  });
}

// ─── Auto Updater ───────────────────────────────────────────
function setupAutoUpdater(): void {
  if (!app.isPackaged) return;
  autoUpdater.checkForUpdatesAndNotify();
  setInterval(() => autoUpdater.checkForUpdatesAndNotify(), 4 * 60 * 60 * 1000);

  autoUpdater.on("update-downloaded", (info) => {
    mainWindow?.webContents.send("update-downloaded", { version: info.version });
  });
}

// ─── Deep Links ─────────────────────────────────────────────
function setupDeepLinks(): void {
  if (process.defaultApp && process.argv.length >= 2) {
    app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [
      path.resolve(process.argv[1]),
    ]);
  } else {
    app.setAsDefaultProtocolClient(PROTOCOL);
  }

  app.on("second-instance", (_event, commandLine) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// ─── App Lifecycle ──────────────────────────────────────────
console.log("[MAIN] Requesting single instance lock...");
const gotTheLock = app.requestSingleInstanceLock();
console.log("[MAIN] Got lock:", gotTheLock);

if (!gotTheLock) {
  console.log("[MAIN] Another instance running, quitting...");
  app.quit();
} else {
  setupDeepLinks();

  app.whenReady().then(() => {
    console.log("[MAIN] App ready, creating window...");
    createWindow();
    createTray();
    setupIPC();
    setupAutoUpdater();
    console.log("[MAIN] All systems initialized.");

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      } else {
        mainWindow?.show();
      }
    });
  });

  app.on("before-quit", () => {
    isQuitting = true;
  });

  app.on("window-all-closed", () => {
    console.log("[MAIN] All windows closed.");
    if (process.platform !== "darwin") app.quit();
  });
}
