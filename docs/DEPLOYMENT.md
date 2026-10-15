# Trido — Deployment & Desktop Packaging Guide

This guide covers deploying and packaging **Trido** across four target environments:
1. **Standalone Windows Desktop Installer (`.exe`)**
2. **Local Production Server (`start.bat` / Node.js)**
3. **Vercel Cloud + Serverless API Deployment**
4. **Docker & Docker Compose (with Local Ollama)**

---

## 1. Environment Variables Reference (`.env`)

Copy `.env.example` to `.env`:

```ini
# Server Port (Default: 3000 for Web/CLI, 3030 inside Electron Desktop .exe)
PORT=3000

# Option 1: Local Ollama (100% Free & Offline Forever)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=trido-model:latest

# Option 2: Personal Google AI Studio API Key
GEMINI_API_KEY=your_google_ai_studio_key_here

# Option 3: Google Cloud Vertex AI (Optional — Evaluation / Enterprise)
GOOGLE_CLOUD_PROJECT=gemma4good-494311
GOOGLE_CLOUD_LOCATION=us-central1
```

---

## 2. Building the Standalone Windows Desktop App (`.exe`)

Trido includes an automated Electron + Express + Faster-Whisper builder (`scripts/build-electron.js` + `electron-builder`) configured for **Windows 11 Smart App Control compatibility** (`"asar": false`, `"signAndEditExecutable": false`).

### Build Command
```bash
npm run build:electron:win
```

### Generated Artifacts (`dist-release/`)
- **`dist-release/Trido Setup 1.0.0.exe` (~168 MB):** Full NSIS installer that creates Desktop & Start Menu shortcuts and bundles the Node/Express server, frontend assets, Smartboard icon (`public/icon.ico`), and offline `whisperService.py`.
- **`dist-release/win-unpacked/Trido.exe`:** Unpacked portable desktop executable.

### Publishing to GitHub Releases & Vercel `/download`
Pushing a `v*` tag triggers [`.github/workflows/release.yml`](../.github/workflows/release.yml) or you can upload manually with GitHub CLI:
```bash
cp "dist-release/Trido Setup 1.0.0.exe" "dist-release/Trido-Setup-1.0.0.exe"
gh release upload v1.1.0 "dist-release/Trido-Setup-1.0.0.exe" --clobber
```
Both `vercel.json` (`/download`) and the Landing Page download buttons point directly to:
`https://github.com/Ardelyo/trido/releases/latest/download/Trido-Setup-1.0.0.exe`

---

## 3. Local Production Server Deployment

```bash
# 1. Install dependencies & verify TypeScript
npm ci
npm run check

# 2. Build optimized Vite + PWA bundle into dist/
npm run build

# 3. Start production Express + Socket.IO server
npm start
```
Verify server health:
```bash
curl http://localhost:3000/api/health
```

---

## 4. Vercel Cloud Deployment

Trido includes serverless API routes under `api/` (`api/health.ts`, `api/ai/status.ts`, `api/ai/generate.ts`, `api/ai/transcribe.ts`, `api/ai/tool-content.ts`) and routing rules in `vercel.json`:

1. Import `Ardelyo/trido` into Vercel.
2. Build Command: `npm run build` | Output Directory: `dist`.
3. Configure optional Environment Variables in Vercel Project Settings (`GEMINI_API_KEY` or `GOOGLE_CLOUD_PROJECT`).
4. Visiting `/download` on Vercel automatically redirects (`302`) to the latest `Trido-Setup-1.0.0.exe` on GitHub Releases.

---

## 5. Docker & Docker Compose (Self-Hosted School Server + Ollama)

```yaml
version: '3.8'

services:
  trido:
    build: .
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
      - OLLAMA_BASE_URL=http://ollama:11434
      - OLLAMA_MODEL=trido-model:latest
    depends_on:
      - ollama

  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    command: serve

volumes:
  ollama_data:
```
