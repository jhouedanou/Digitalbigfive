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

// Configure logging
log.transports.file.level = "info";
autoUpdater.logger = log;

// Constants
const APP_URL = "https://digitalbigfive.vercel.app";
const DEV_URL = "http://localhost:3000";
const PROTOCOL = "bigfive";

const ALLOWED_DOMAINS = [
  "digitalbigfive.vercel.app",
  "localhost",
  // Supabase
  "jqsyxftdargaottivpeh.supabase.co",
  "supabase.co",
  "supabase.com",
  // PayTech / Moneroo
  "paytech.sn",
  "moneroo.io",
  "api.moneroo.io",
  // Auth providers
  "accounts.google.com",
];

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;

function getBaseUrl(): string {
  return app.isPackaged ? APP_URL : DEV_URL;
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

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: getIconPath(
      process.platform === "win32" ? "icon.ico" : "icon.png"
    ),
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      // Persist storage (cookies, localStorage, IndexedDB, service workers)
      partition: "persist:bigfive",
    },
    show: false,
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    autoHideMenuBar: true,
  });

  // Show window when ready
  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  // Load the app
  mainWindow.loadURL(getBaseUrl());

  // Open DevTools in dev mode
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools({ mode: "detach" });
  }

  // Minimize to tray instead of closing
  mainWindow.on("close", (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Security: restrict navigation to allowed domains
  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (!isAllowedUrl(url)) {
      event.preventDefault();
      log.warn(`Blocked navigation to: ${url}`);
    }
  });

  // Security: handle new window requests (open external links in browser)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isAllowedUrl(url)) {
      shell.openExternal(url);
    } else {
      log.warn(`Blocked popup to: ${url}`);
    }
    return { action: "deny" };
  });

  // Monitor online/offline status
  mainWindow.webContents.on("did-finish-load", () => {
    mainWindow?.webContents.send("online-status", true);
  });

  mainWindow.webContents.on(
    "did-fail-load",
    (_event, errorCode, errorDescription) => {
      log.error(`Load failed: ${errorCode} - ${errorDescription}`);
      if (errorCode === -106 || errorCode === -105) {
        // ERR_INTERNET_DISCONNECTED or ERR_NAME_NOT_RESOLVED
        mainWindow?.webContents.send("online-status", false);
      }
    }
  );
}

function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Allow data: and blob: URLs (used by PDF reader, etc.)
    if (parsed.protocol === "data:" || parsed.protocol === "blob:") {
      return true;
    }
    // Allow the deep link protocol
    if (parsed.protocol === `${PROTOCOL}:`) {
      return true;
    }
    return ALLOWED_DOMAINS.some(
      (domain) =>
        parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

function createTray(): void {
  const trayIconPath = getIconPath("tray-icon.png");
  const icon = nativeImage.createFromPath(trayIconPath);
  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Ouvrir Big Five Digital",
      click: () => {
        mainWindow?.show();
        mainWindow?.focus();
      },
    },
    { type: "separator" },
    {
      label: "Bibliothèque",
      click: () => {
        mainWindow?.show();
        mainWindow?.focus();
        mainWindow?.loadURL(`${getBaseUrl()}/library`);
      },
    },
    {
      label: "Produits",
      click: () => {
        mainWindow?.show();
        mainWindow?.focus();
        mainWindow?.loadURL(`${getBaseUrl()}/products`);
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
  ]);

  tray.setToolTip("Big Five Digital");
  tray.setContextMenu(contextMenu);

  // Double-click on tray icon opens the window
  tray.on("double-click", () => {
    mainWindow?.show();
    mainWindow?.focus();
  });
}

function setupAutoUpdater(): void {
  if (!app.isPackaged) return;

  autoUpdater.checkForUpdatesAndNotify();

  // Check for updates every 4 hours
  setInterval(
    () => {
      autoUpdater.checkForUpdatesAndNotify();
    },
    4 * 60 * 60 * 1000
  );

  autoUpdater.on("update-available", (info) => {
    log.info(`Update available: ${info.version}`);
    mainWindow?.webContents.send("update-available", {
      version: info.version,
    });
  });

  autoUpdater.on("update-downloaded", (info) => {
    log.info(`Update downloaded: ${info.version}`);
    mainWindow?.webContents.send("update-downloaded", {
      version: info.version,
    });
  });

  autoUpdater.on("error", (error) => {
    log.error("Auto-update error:", error);
  });
}

function setupIPC(): void {
  ipcMain.handle("app:get-version", () => app.getVersion());
  ipcMain.handle("app:get-platform", () => process.platform);

  ipcMain.on("navigate", (_event, path: string) => {
    mainWindow?.loadURL(`${getBaseUrl()}${path}`);
  });

  ipcMain.on("install-update", () => {
    isQuitting = true;
    autoUpdater.quitAndInstall();
  });

  ipcMain.on("window:minimize", () => mainWindow?.minimize());
  ipcMain.on("window:maximize", () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });
  ipcMain.on("window:close", () => mainWindow?.close());
}

function setupDeepLinks(): void {
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [
        path.resolve(process.argv[1]),
      ]);
    }
  } else {
    app.setAsDefaultProtocolClient(PROTOCOL);
  }

  // Handle deep link on macOS
  app.on("open-url", (event, url) => {
    event.preventDefault();
    handleDeepLink(url);
  });

  // Handle deep link on Windows/Linux (single instance)
  app.on("second-instance", (_event, commandLine) => {
    const deepLink = commandLine.find((arg) => arg.startsWith(`${PROTOCOL}://`));
    if (deepLink) {
      handleDeepLink(deepLink);
    }

    // Focus existing window
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

function handleDeepLink(url: string): void {
  try {
    const parsed = new URL(url);
    const routePath = parsed.pathname || "/";
    log.info(`Deep link: ${url} -> ${routePath}`);
    mainWindow?.loadURL(`${getBaseUrl()}${routePath}`);
    mainWindow?.show();
    mainWindow?.focus();
  } catch (error) {
    log.error("Invalid deep link:", error);
  }
}

// Ensure single instance
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  setupDeepLinks();

  app.whenReady().then(() => {
    createWindow();
    createTray();
    setupIPC();
    setupAutoUpdater();

    app.on("activate", () => {
      // macOS: re-create window when dock icon is clicked
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
    if (process.platform !== "darwin") {
      app.quit();
    }
  });
}
