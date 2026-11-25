import { app, BrowserWindow, Menu, shell, nativeTheme, type MenuItemConstructorOptions } from "electron";
import path from "node:path";

/** URL of the Vidora web app (Next.js). Point this at your deployed URL for production builds. */
const APP_URL = process.env.DESKTOP_APP_URL || "http://localhost:3000";
const APP_ORIGIN = new URL(APP_URL).origin;

let win: BrowserWindow | null = null;

function createWindow() {
  nativeTheme.themeSource = "dark";
  win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 380,
    minHeight: 600,
    title: "Vidora",
    backgroundColor: "#0f0f0f",
    icon: path.join(__dirname, "../build/icon.png"),
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    trafficLightPosition: { x: 14, y: 20 },
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // Leave room for macOS traffic lights over the web app's top bar.
  if (process.platform === "darwin") {
    win.webContents.on("did-finish-load", () => {
      win?.webContents.insertCSS(
        "header{padding-left:80px!important;-webkit-app-region:drag}header a,header button{-webkit-app-region:no-drag}",
      );
    });
  }

  win.once("ready-to-show", () => win?.show());
  win.loadURL(APP_URL).catch(() => showOffline());
  win.webContents.on("did-fail-load", (_e, code, _desc, url) => {
    if (code !== -3 && url.startsWith(APP_ORIGIN)) showOffline();
  });

  // Links to other sites open in the user's browser, not inside the app.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(APP_ORIGIN)) shell.openExternal(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (e, url) => {
    if (!url.startsWith(APP_ORIGIN)) {
      e.preventDefault();
      shell.openExternal(url);
    }
  });
  win.on("closed", () => (win = null));
}

function showOffline() {
  const html = `<!doctype html><html><body style="margin:0;height:100vh;display:flex;align-items:center;justify-content:center;background:#0f0f0f;color:#f1f1f1;font-family:-apple-system,Segoe UI,sans-serif;text-align:center">
  <div><h1 style="font-size:22px">Can't reach Vidora</h1><p style="color:#aaa">Make sure the server is running at ${APP_URL}</p>
  <button onclick="location.href='${APP_URL}'" style="margin-top:12px;padding:10px 20px;border:0;border-radius:999px;background:#f1f1f1;color:#0f0f0f;font-weight:600;cursor:pointer">Retry</button></div></body></html>`;
  win?.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
}

function buildMenu() {
  const go = (p: string) => () => win?.loadURL(`${APP_URL}${p}`);
  const template: MenuItemConstructorOptions[] = [
    ...(process.platform === "darwin" ? [{ role: "appMenu" as const }] : []),
    {
      label: "File",
      submenu: [
        { label: "Upload Video", accelerator: "CmdOrCtrl+U", click: go("/upload") },
        { type: "separator" },
        process.platform === "darwin" ? { role: "close" } : { role: "quit" },
      ],
    },
    { role: "editMenu" },
    {
      label: "Go",
      submenu: [
        { label: "Home", accelerator: "CmdOrCtrl+Shift+H", click: go("/") },
        { label: "Account", accelerator: "CmdOrCtrl+Shift+A", click: go("/account") },
        { type: "separator" },
        { label: "Back", accelerator: "CmdOrCtrl+[", click: () => win?.webContents.navigationHistory.goBack() },
        { label: "Forward", accelerator: "CmdOrCtrl+]", click: () => win?.webContents.navigationHistory.goForward() },
      ],
    },
    { role: "viewMenu" },
    { role: "windowMenu" },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });
  app.whenReady().then(() => {
    buildMenu();
    createWindow();
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
}
