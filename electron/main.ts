import { app, BrowserWindow, ipcMain, shell, session, dialog, type IpcMainInvokeEvent } from 'electron';
import net from 'net';
import path from 'path';
import fs from 'fs';
// __dirname and require are provided by esbuild's CJS output
declare const __dirname: string;
declare function require(id: string): any;

const PREFERRED_PORT = 3030;
let PORT = PREFERRED_PORT;

let mainWindow: BrowserWindow | null = null;
let serverStarted = false;

// ── Logging (userData/logs/main.log) ───────────────────────────────────────────

function log(level: 'info' | 'warn' | 'error', ...args: unknown[]): void {
  const line = `${new Date().toISOString()} [${level}] ${args.map(a => (a instanceof Error ? a.stack : typeof a === 'string' ? a : JSON.stringify(a))).join(' ')}\n`;
  try {
    const dir = path.join(app.getPath('userData'), 'logs');
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, 'main.log');
    // Rotate at ~1 MB so the log never grows unbounded on a classroom machine
    if (fs.existsSync(file) && fs.statSync(file).size > 1_000_000) fs.renameSync(file, file + '.old');
    fs.appendFileSync(file, line);
  } catch { /* logging must never crash the app */ }
  (level === 'error' ? console.error : console.log)('[electron]', ...args);
}

// ── Free port discovery ────────────────────────────────────────────────────────

function isPortFree(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const probe = net.createServer()
      .once('error', () => resolve(false))
      .once('listening', () => probe.close(() => resolve(true)))
      .listen(port, '0.0.0.0');
  });
}

async function pickPort(): Promise<number> {
  for (let p = PREFERRED_PORT; p < PREFERRED_PORT + 20; p++) {
    if (await isPortFree(p)) return p;
  }
  return PREFERRED_PORT;
}

// ── Window state persistence ───────────────────────────────────────────────────

interface WindowState { width: number; height: number; x?: number; y?: number; maximized?: boolean; }

function stateFile(): string { return path.join(app.getPath('userData'), 'window-state.json'); }

function loadWindowState(): WindowState {
  try {
    const st = JSON.parse(fs.readFileSync(stateFile(), 'utf8')) as WindowState;
    if (st.width >= 960 && st.height >= 640) return st;
  } catch { /* first launch */ }
  return { width: 1440, height: 900 };
}

function saveWindowState(win: BrowserWindow): void {
  try {
    const maximized = win.isMaximized();
    const b = maximized ? win.getNormalBounds() : win.getBounds();
    fs.writeFileSync(stateFile(), JSON.stringify({ ...b, maximized }), 'utf8');
  } catch { /* ignore */ }
}

// ── Auto-update (GitHub Releases via electron-updater) ─────────────────────────
// Only active in packaged builds. Failures (offline classroom, no release) are logged, never shown.
function setupAutoUpdate(): void {
  if (!app.isPackaged) return;
  try {
    const { autoUpdater } = require('electron-updater');
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.on('error', (err: Error) => log('warn', 'Update check failed:', err.message));
    autoUpdater.on('update-available', (info: { version: string }) => {
      log('info', 'Update available:', info.version);
      mainWindow?.webContents.send('update-status', { state: 'available', version: info.version });
    });
    autoUpdater.on('update-downloaded', (info: { version: string }) => {
      log('info', 'Update downloaded:', info.version);
      mainWindow?.webContents.send('update-status', { state: 'ready', version: info.version });
    });
    autoUpdater.checkForUpdates().catch((err: Error) => log('warn', 'Update check failed:', err.message));
  } catch (err) {
    log('warn', 'Auto-updater unavailable:', err as Error);
  }
}

// ── Trust checks ───────────────────────────────────────────────────────────────

function isTrustedUrl(url: string): boolean {
  return url.startsWith(`http://localhost:${PORT}`) || url.startsWith('file://');
}

/** IPC is only honoured for frames served by our own local server or bundled pages. */
function isTrustedSender(event: IpcMainInvokeEvent): boolean {
  const url = event.senderFrame?.url ?? '';
  return isTrustedUrl(url);
}

// ── API key helpers ────────────────────────────────────────────────────────────

function getUserEnvPath(): string {
  return path.join(app.getPath('userData'), '.env');
}

function loadSavedApiKey(): string {
  try {
    const envPath = getUserEnvPath();
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match = content.match(/^GEMINI_API_KEY=(.+)$/m);
      if (match?.[1] && !match[1].includes('your_gemini')) return match[1].trim();
    }
    // Also check .env next to exe (useful for portable/zip distribution)
    const portableEnv = path.join(path.dirname(app.getPath('exe')), '.env');
    if (fs.existsSync(portableEnv)) {
      const content = fs.readFileSync(portableEnv, 'utf8');
      const match = content.match(/^GEMINI_API_KEY=(.+)$/m);
      if (match?.[1] && !match[1].includes('your_gemini')) return match[1].trim();
    }
  } catch { /* ignore */ }
  return '';
}

function persistApiKey(key: string): void {
  const cleanKey = key.trim().replace(/\s+/g, '');
  const envPath = getUserEnvPath();
  fs.mkdirSync(path.dirname(envPath), { recursive: true });
  fs.writeFileSync(envPath, `GEMINI_API_KEY=${cleanKey}\n`, 'utf8');
  process.env.GEMINI_API_KEY = cleanKey;
}

// ── Server start ───────────────────────────────────────────────────────────────

function startServer(): void {
  if (serverStarted) return;
  serverStarted = true;

  // Set dist path and writable userData rooms path so server-bundle works inside Program Files
  process.env.APP_DIST_PATH = path.join(__dirname, '..', 'dist');
  process.env.ROOMS_FILE_PATH = path.join(app.getPath('userData'), 'rooms.json');
  process.env.NODE_ENV = 'production';
  process.env.SERVER_PORT = String(PORT);

  // Apply any saved API key
  const savedKey = loadSavedApiKey();
  if (savedKey) process.env.GEMINI_API_KEY = savedKey;

  try {
    require(path.join(__dirname, 'server-bundle.cjs'));
  } catch (err: any) {
    log('error', 'Server start error:', err?.message ?? String(err));
  }
}

// ── Wait for server ready ─────────────────────────────────────────────────────

async function waitForServer(timeoutMs = 20000): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://localhost:${PORT}/api/health`);
      if (res.ok) return true;
    } catch { /* still booting */ }
    await new Promise(r => setTimeout(r, 400));
  }
  return false;
}

// ── Mic & media permission handler ───────────────────────────────────────────
// Without this, Electron blocks getUserMedia and Web Speech API silently.
function setupPermissions(): void {
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowed = ['media', 'microphone', 'audioCapture', 'notifications', 'fullscreen'].includes(permission)
      && isTrustedUrl(webContents.getURL());
    callback(allowed);
  });
  // Allow microphone access from localhost (needed for getUserMedia)
  session.defaultSession.setPermissionCheckHandler((_webContents, permission) => {
    if (['media', 'microphone', 'audioCapture'].includes(permission)) return true;
    return false;
  });
}

// Baseline hardening that cannot break the app: no plugins, no framing, no base-tag hijack.
function setupSecurityHeaders(): void {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    if (!isTrustedUrl(details.url)) return callback({});
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': ["object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'"],
        'X-Content-Type-Options': ['nosniff'],
      },
    });
  });
}

// ── Window factory ─────────────────────────────────────────────────────────────

async function createWindow(): Promise<void> {
  const iconPath = fs.existsSync(path.join(__dirname, 'icon.png'))
    ? path.join(__dirname, 'icon.png')
    : path.join(__dirname, '..', 'public', 'pwa-512x512.png');

  const saved = loadWindowState();
  mainWindow = new BrowserWindow({
    width: saved.width,
    height: saved.height,
    x: saved.x,
    y: saved.y,
    minWidth: 960,
    minHeight: 640,
    title: 'Trido — AI Smartboard Classroom',
    icon: iconPath,
    show: false,
    backgroundColor: '#e4e3e0',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
      // Required for getUserMedia and Web Speech API to work from localhost
      allowRunningInsecureContent: false,
      sandbox: false, // preload is a bundled CJS file; contextIsolation + no nodeIntegration still apply
      webSecurity: true,
    },
  });

  if (saved.maximized) mainWindow.maximize();
  const win = mainWindow;
  win.on('close', () => saveWindowState(win));
  win.on('enter-full-screen', () => win.webContents.send('fullscreen-changed', true));
  win.on('leave-full-screen', () => win.webContents.send('fullscreen-changed', false));

  // F11 toggles fullscreen — standard for smartboard / kiosk-style classroom use
  win.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown' && input.key === 'F11') {
      win.setFullScreen(!win.isFullScreen());
      event.preventDefault();
    }
  });

  // Never navigate the app window away from our own origin; open everything else in the OS browser
  win.webContents.on('will-navigate', (event, url) => {
    if (!isTrustedUrl(url)) {
      event.preventDefault();
      if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    }
  });
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('render-process-gone', (_e, details) => {
    log('error', 'Renderer gone:', details.reason);
    if (details.reason !== 'clean-exit') win.reload();
  });

  mainWindow.setMenuBarVisibility(false);

  // Show splash immediately
  await mainWindow.loadFile(path.join(__dirname, 'splash.html'));
  mainWindow.show();

  // Pick a free port (3030 preferred) so a second app or stray process never blocks startup
  PORT = await pickPort();
  log('info', `Starting server on port ${PORT}`);
  startServer();

  const ready = await waitForServer();
  if (ready) {
    await mainWindow.loadURL(`http://localhost:${PORT}/?app=true`);
  } else {
    // Server failed — show error page
    await mainWindow.loadFile(path.join(__dirname, 'splash.html'));
    mainWindow.webContents.executeJavaScript(
      `document.querySelector('.status').textContent = '❌ Server failed to start. See logs: ${app.getPath('userData').replace(/\\/g, '/')}/logs/main.log';
       document.querySelector('.spinner').style.display = 'none';`
    ).catch(() => {});
  }
}

// ── IPC ────────────────────────────────────────────────────────────────────────

// Save API key from in-app settings or setup page, reload to apply
ipcMain.handle('save-api-key', async (event, key: string) => {
  if (!isTrustedSender(event)) return { ok: false, error: 'Untrusted sender.' };
  if (!key || key.length < 10) return { ok: false, error: 'Invalid API key.' };
  persistApiKey(key.trim());
  return { ok: true };
});

// Skip setup without saving key (run in demo/offline mode)
ipcMain.handle('skip-setup', async (event) => {
  if (!isTrustedSender(event)) return { ok: false };
  if (mainWindow) await mainWindow.loadURL(`http://localhost:${PORT}/?app=true`);
  return { ok: true };
});

ipcMain.handle('open-external', (event, url: string) => {
  if (!isTrustedSender(event)) return;
  if (typeof url === 'string' && /^https?:\/\//i.test(url)) {
    return shell.openExternal(url);
  }
});

ipcMain.handle('get-app-info', (event) => {
  if (!isTrustedSender(event)) return null;
  return {
    version: app.getVersion(),
    platform: process.platform,
    port: PORT,
    userDataPath: app.getPath('userData'),
  };
});

ipcMain.handle('install-update', (event) => {
  if (!isTrustedSender(event) || !app.isPackaged) return;
  try { require('electron-updater').autoUpdater.quitAndInstall(); } catch (err) { log('warn', 'quitAndInstall failed:', err as Error); }
});

ipcMain.handle('toggle-fullscreen', (event) => {
  if (!isTrustedSender(event) || !mainWindow) return false;
  mainWindow.setFullScreen(!mainWindow.isFullScreen());
  return mainWindow.isFullScreen();
});

ipcMain.handle('is-fullscreen', (event) => isTrustedSender(event) && !!mainWindow?.isFullScreen());

// Native "Save as…" dialog. Data arrives as bytes so binary formats (PNG/PDF) survive intact.
ipcMain.handle('save-file', async (event, payload: { data: ArrayBuffer | Uint8Array; defaultName: string; filters?: { name: string; extensions: string[] }[] }) => {
  if (!isTrustedSender(event) || !mainWindow) return { ok: false, error: 'Untrusted sender.' };
  const safeName = path.basename(String(payload?.defaultName || 'trido-export'));
  const res = await dialog.showSaveDialog(mainWindow, {
    defaultPath: path.join(app.getPath('documents'), safeName),
    filters: payload?.filters,
  });
  if (res.canceled || !res.filePath) return { ok: false, canceled: true };
  try {
    fs.writeFileSync(res.filePath, Buffer.from(payload.data as ArrayBuffer));
    return { ok: true, path: res.filePath };
  } catch (err: any) {
    log('error', 'save-file failed:', err);
    return { ok: false, error: err?.message ?? 'Write failed.' };
  }
});

// Native "Open…" dialog, returns file bytes (capped at 50 MB).
ipcMain.handle('open-file', async (event, opts?: { filters?: { name: string; extensions: string[] }[] }) => {
  if (!isTrustedSender(event) || !mainWindow) return { ok: false, error: 'Untrusted sender.' };
  const res = await dialog.showOpenDialog(mainWindow, { properties: ['openFile'], filters: opts?.filters });
  if (res.canceled || !res.filePaths[0]) return { ok: false, canceled: true };
  const file = res.filePaths[0];
  if (fs.statSync(file).size > 50 * 1024 * 1024) return { ok: false, error: 'File too large (max 50 MB).' };
  return { ok: true, name: path.basename(file), data: fs.readFileSync(file) };
});

// ── App lifecycle ──────────────────────────────────────────────────────────────

// Single instance: a second launch focuses the existing window instead of fighting over the port
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  process.on('uncaughtException', err => log('error', 'uncaughtException:', err));
  process.on('unhandledRejection', err => log('error', 'unhandledRejection:', err as Error));

  app.whenReady().then(() => {
    setupPermissions();
    setupSecurityHeaders();
    createWindow().then(setupAutoUpdate);
  });
}

app.on('window-all-closed', () => { app.quit(); });

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
