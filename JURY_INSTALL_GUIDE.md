# 🏆 Trido — Judge & Evaluator Installation Guide

Welcome to the **Trido** evaluation guide. Trido is a voice-first, AI-powered smartboard designed with **Pak Damar** for inclusive, offline-capable classroom instruction.

---

## 🚀 Option 1: Standalone Windows Desktop App (`.exe`) *(Fastest — Zero Setup)*

No Node.js, Python, or terminal knowledge is required:

1. **Download Installer:** [**Trido-Setup-1.0.0.exe (168 MB)**](https://github.com/Ardelyo/trido/releases/latest/download/Trido-Setup-1.0.0.exe) *(or use `dist-release/Trido Setup 1.0.0.exe` if building locally)*.
2. **Install & Launch:** Double-click `Trido-Setup-1.0.0.exe` and open **Trido** from your Desktop shortcut.
3. **Start Teaching:** The tactile intro screen boots the embedded local server on port `3030` and opens the Smartboard workspace automatically.

---

## ⚡ Option 2: 1-Click Localhost Launcher (`start.bat` on Windows)

If you cloned or unzipped the source repository on Windows:

1. Double-click **`start.bat`** in the project root directory.
2. `start.bat` automatically verifies Node.js, installs dependencies on first run (skipping redundant installs on subsequent launches), starts the server at `http://localhost:3000`, and opens Chrome/Edge directly to `http://localhost:3000/?app=true`.

---

## 🛠️ Option 3: Cross-Platform Terminal Launch (Windows / macOS / Linux)

```bash
npm install
npm run dev
```
Open **`http://localhost:3000/?app=true`** in Chrome or Edge.

---

## 🧠 AI Model & API Key Configuration (Important Notice)

Click the **Settings (⚙️)** icon in the left sidebar to choose your AI mode:

> ⚠️ **Evaluation Notice:** The built-in Cloud Demo (`gemma4good`) is currently enabled so judges can test Trido immediately out of the box, **but it will not be free forever**. For permanent, independent classroom use, we strongly recommend Option A or Option B below:

### Option A — Download Trido Local Models via Ollama (100% Free & Offline Forever)
1. Install [Ollama](https://ollama.com).
2. In Trido, open **Settings (⚙️) → Kecerdasan AI (AI Configuration)** and select **🏠 Ollama Lokal**.
3. Choose **`trido-model:latest`** (9B Flagship) or **`trido-gemma:2b`** (Lightweight Edge) and click **"Unduh & Kalibrasi Model Lokal Otomatis (1-Klik)"** — or run in terminal:
   ```bash
   ollama pull trido-model:latest
   ollama pull trido-gemma:2b
   ```

### Option B — Use Your Personal Google AI Studio API Key
1. Get a free API key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey).
2. In Trido, open **Settings (⚙️) → Kecerdasan AI**, select **✨ Gemini Cloud**, paste your `AIzaSy...` key, and click **Simpan (Save)**.

---

## 🧪 Quick Evaluation Checklist

1. **Instant Voice / Chat Reflex (<15ms Jev-1 Engine):**
   - Open the **`Asisten`** sidebar (top-right button) or click the **Voice Island Mic** at the bottom.
   - Type or say: `"Halo Trido, tolong pasang timer sepuluh menit"` -> Watch a 10:00 countdown timer appear immediately on the board.
2. **Self-Healing Mermaid Mindmap Generation & In-Place Expansion:**
   - Say or type: `"Buatkan peta konsep tentang sistem peredaran darah manusia"`.
   - Follow up with: `"Tambahkan cabang gangguan peredaran darah pada peta konsep tadi"` -> Watch Trido update the existing mindmap **in-place** without creating a duplicate widget.
3. **120 FPS Dragging & Multi-Page Synchronization:**
   - Drag any widget across the board (zero-lag `translate3d` GPU compositing).
   - Click **`+`** (bottom-left) to add Page 2, then switch back to Page 1 — all widgets and diagrams on Page 1 are preserved intact.
4. **Multilingual Switching:**
   - Open **Settings (⚙️) → Bahasa & Tema** and switch between **Bahasa Indonesia**, **English**, **Arabic**, **Chinese**, **Japanese**, and 6 other languages.
