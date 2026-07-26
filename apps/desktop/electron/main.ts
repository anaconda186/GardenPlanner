import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type * as ElectronApi from 'electron';
import type { BrowserWindow as BrowserWindowInstance } from 'electron';

/**
 * Electron is loaded through createRequire rather than `import { app } from 'electron'`.
 *
 * The electron module is CommonJS and builds its exports dynamically, so Node's
 * static lexer cannot see them: a named ESM import fails at load with "does not
 * provide an export named 'BrowserWindow'". The 'electron/main' subpath does not
 * help either — the package ships no exports map. A plain default import works at
 * runtime but types every member as `any`, which silently removes type safety
 * from the entire main process.
 *
 * This keeps both. Main stays ESM rather than reverting to CommonJS because
 * @sqlite.org/sqlite-wasm is ESM-only and Phase 1 loads it here.
 */
const require = createRequire(import.meta.url);
const { app, BrowserWindow, ipcMain, shell } = require('electron') as typeof ElectronApi;

const here = path.dirname(fileURLToPath(import.meta.url));

/** Set by the dev script. Absent in a packaged build, which loads from disk. */
const devServerUrl = process.env.VITE_DEV_SERVER_URL;

/**
 * Garden Planner is a local-only app: it renders its own bundle and talks to no
 * remote origin except the weather API, which is called from the main process
 * rather than the renderer. Everything below narrows the renderer to exactly that.
 * See docs/adr/0001 — Electron's larger security surface is the cost of the shell,
 * and this is the mitigation that was promised there.
 */
function hardenWindow(win: BrowserWindowInstance): void {
  // Links to the outside world open in the real browser, never in-app, so no
  // remote page ever runs inside a window holding a preload bridge.
  win.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: 'deny' };
  });

  // Block navigation away from our own bundle. Without this, a stray anchor or
  // injected script could replace the app with a remote page that keeps the
  // bridge.
  win.webContents.on('will-navigate', (event, url) => {
    const allowed = devServerUrl ? url.startsWith(devServerUrl) : url.startsWith('file://');
    if (!allowed) {
      event.preventDefault();
      void shell.openExternal(url);
    }
  });

  // Nothing here needs the camera, microphone, location or notifications yet.
  // Deny by default and open specific ones deliberately when a feature needs them.
  win.webContents.session.setPermissionRequestHandler((_wc, _permission, callback) => {
    callback(false);
  });
}

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 940,
    minHeight: 620,
    title: 'Garden Planner',
    // Painting the background before the renderer is ready avoids the white
    // flash on launch.
    backgroundColor: '#10130e',
    show: false,
    webPreferences: {
      preload: path.join(here, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });

  hardenWindow(win);
  win.once('ready-to-show', () => {
    win.show();
  });

  if (devServerUrl) {
    void win.loadURL(devServerUrl);
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    void win.loadFile(path.join(here, '..', 'dist', 'index.html'));
  }
}

ipcMain.handle('app:version', () => app.getVersion());

// One window is the whole app. A second instance should surface the existing
// window rather than open a rival one holding the same SQLite file.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const [existing] = BrowserWindow.getAllWindows();
    if (existing) {
      if (existing.isMinimized()) existing.restore();
      existing.focus();
    }
  });

  void app.whenReady().then(() => {
    createWindow();

    // macOS keeps the app alive with no windows; reopening should make one.
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
