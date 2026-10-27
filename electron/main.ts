import { app, BrowserWindow, ipcMain, shell, session } from 'electron';
import path from 'path';
import fs from 'fs';

// disuntik langsung dari bundle CJS esbuild
declare const __dirname: string;
declare function require(id: string): any;

const PORT = 3030;

let mainWindow: BrowserWindow | null = null;
let serverStarted = false;

function getUserEnvPath(): string {
  return path.join(app.getPath('userData'), '.env');
}

function loadSavedApiKey(): string {
  try {
    const envPath = getUserEnvPath();
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const m = content.match(/^GEMINI_API_KEY=(.+)$/m);
      if (m?.[1] && !m[1].includes('your_gemini')) return m[1].trim();
    }
    // cek jg .env di sebelah file exe (buat yg pake versi portable/zip)
    const portableEnv = path.join(path.dirname(app.getPath('exe')), '.env');
    if (fs.existsSync(portableEnv)) {
      const content = fs.readFileSync(portableEnv, 'utf8');
      const m = content.match(/^GEMINI_API_KEY=(.+)$/m);
      if (m?.[1] && !m[1].includes('your_gemini')) return m[1].trim();
    }
  } catch { /* abaikan kalo gagal baca */ }
  return '';
}

function persistApiKey(key: string): void {
  const cleanKey = key.trim().replace(/\s+/g, '');
  const envPath = getUserEnvPath();
  fs.mkdirSync(path.dirname(envPath), { recursive: true });
  fs.writeFileSync(envPath, `GEMINI_API_KEY=${cleanKey}\n`, 'utf8');
  process.env.GEMINI_API_KEY = cleanKey;
}

function startServer(): void {
  if (serverStarted) return;
  serverStarted = true;

  // folder Program Files di Windows itu read-only, jadi rooms.json harus ditaro di userData biar ga error EPERM
  process.env.APP_DIST_PATH = path.join(__dirname, '..', 'dist');
  process.env.ROOMS_FILE_PATH = path.join(app.getPath('userData'), 'rooms.json');
  process.env.NODE_ENV = 'production';
  process.env.SERVER_PORT = String(PORT);

  const savedKey = loadSavedApiKey();
  if (savedKey) process.env.GEMINI_API_KEY = savedKey;

  try {
    require(path.join(__dirname, 'server-bundle.cjs'));
  } catch (err: any) {
    console.error('[electron] gagal nyalain server lokal:', err?.message ?? err);
  }
}

async function waitForServer(timeoutMs = 20000): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://localhost:${PORT}/api/health`);
      if (res.ok) return true;
    } catch { /* masih booting, tunggu bentar */ }
    await new Promise(r => setTimeout(r, 400));
  }
  return false;
}

// tanpa handler ini, Electron diem2 ngeblokir mikrofon (getUserMedia & Web Speech API) di localhost
function setupPermissions(): void {
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, cb) => {
    const allowed = ['media', 'microphone', 'audioCapture', 'notifications'].includes(permission);
    cb(allowed);
  });
  session.defaultSession.setPermissionCheckHandler((_webContents, permission) => {
    return ['media', 'microphone', 'audioCapture'].includes(permission);
  });
}

async function createWindow(): Promise<void> {
  const iconPath = fs.existsSync(path.join(__dirname, 'icon.png'))
    ? path.join(__dirname, 'icon.png')
    : path.join(__dirname, '..', 'public', 'pwa-512x512.png');

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
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
      allowRunningInsecureContent: false,
    },
  });

  mainWindow.setMenuBarVisibility(false);

  await mainWindow.loadFile(path.join(__dirname, 'splash.html'));
  mainWindow.show();

  startServer();

  const ready = await waitForServer();
  if (ready) {
    await mainWindow.loadURL(`http://localhost:${PORT}/?app=true`);
  } else {
    await mainWindow.loadFile(path.join(__dirname, 'splash.html'));
    mainWindow.webContents.executeJavaScript(
      `document.querySelector('.status').textContent = 'Server gagal jalan. Coba tutup lalu buka ulang aplikasinya.';
       document.querySelector('.spinner').style.display = 'none';`
    ).catch(() => {});
  }
}

ipcMain.handle('save-api-key', async (_, key: string) => {
  if (!key || key.length < 10) return { ok: false, error: 'Invalid API key.' };
  persistApiKey(key.trim());
  return { ok: true };
});

ipcMain.handle('skip-setup', async () => {
  if (mainWindow) await mainWindow.loadURL(`http://localhost:${PORT}`);
  return { ok: true };
});

ipcMain.handle('open-external', (_, url: string) => {
  if (typeof url === 'string' && /^https?:\/\//i.test(url)) {
    return shell.openExternal(url);
  }
});

app.whenReady().then(() => {
  setupPermissions();
  createWindow();
});

app.on('window-all-closed', () => { app.quit(); });

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
