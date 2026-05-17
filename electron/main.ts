import { app, BrowserWindow, ipcMain, shell, session } from 'electron';
import path from 'path';
import fs from 'fs';
// __dirname and require are provided by esbuild's CJS output
declare const __dirname: string;
declare function require(id: string): any;

const PORT = 3030;

let mainWindow: BrowserWindow | null = null;
let serverStarted = false;

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
  const envPath = getUserEnvPath();
  fs.mkdirSync(path.dirname(envPath), { recursive: true });
  fs.writeFileSync(envPath, `GEMINI_API_KEY=${key}\n`, 'utf8');
  process.env.GEMINI_API_KEY = key;
}

// ── Server start ───────────────────────────────────────────────────────────────

function startServer(): void {
  if (serverStarted) return;
  serverStarted = true;

  // Set dist path so server-bundle finds the frontend assets
  process.env.APP_DIST_PATH = path.join(__dirname, '..', 'dist');
  process.env.NODE_ENV = 'production';
  process.env.SERVER_PORT = String(PORT);

  // Apply any saved API key
  const savedKey = loadSavedApiKey();
  if (savedKey) process.env.GEMINI_API_KEY = savedKey;

  try {
    require(path.join(__dirname, 'server-bundle.cjs'));
  } catch (err: any) {
    console.error('[electron] Server start error:', err?.message ?? err);
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
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    const allowed = ['media', 'microphone', 'audioCapture', 'notifications'].includes(permission);
    callback(allowed);
  });
  // Allow microphone access from localhost (needed for getUserMedia)
  session.defaultSession.setPermissionCheckHandler((_webContents, permission) => {
    if (['media', 'microphone', 'audioCapture'].includes(permission)) return true;
    return false;
  });
}

// ── Window factory ─────────────────────────────────────────────────────────────

async function createWindow(): Promise<void> {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    title: 'Trido — AI Digital Classroom',
    show: false,
    backgroundColor: '#0f172a',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
      // Required for getUserMedia and Web Speech API to work from localhost
      allowRunningInsecureContent: false,
    },
  });

  mainWindow.setMenuBarVisibility(false);

  // Show splash immediately
  await mainWindow.loadFile(path.join(__dirname, 'splash.html'));
  mainWindow.show();

  // Start server unconditionally — no API key gate
  startServer();

  const ready = await waitForServer();
  if (ready) {
    await mainWindow.loadURL(`http://localhost:${PORT}`);
  } else {
    // Server failed — show error page
    await mainWindow.loadFile(path.join(__dirname, 'splash.html'));
    mainWindow.webContents.executeJavaScript(
      `document.querySelector('.status').textContent = '❌ Server failed to start. Please restart.';
       document.querySelector('.spinner').style.display = 'none';`
    ).catch(() => {});
  }
}

// ── IPC ────────────────────────────────────────────────────────────────────────

// Save API key from in-app settings or setup page, reload to apply
ipcMain.handle('save-api-key', async (_, key: string) => {
  if (!key || key.length < 10) return { ok: false, error: 'Invalid API key.' };
  persistApiKey(key.trim());
  return { ok: true };
});

// Skip setup without saving key (run in demo/offline mode)
ipcMain.handle('skip-setup', async () => {
  if (mainWindow) await mainWindow.loadURL(`http://localhost:${PORT}`);
  return { ok: true };
});

ipcMain.handle('open-external', (_, url: string) => shell.openExternal(url));

// ── App lifecycle ──────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  setupPermissions();
  createWindow();
});

app.on('window-all-closed', () => { app.quit(); });

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
