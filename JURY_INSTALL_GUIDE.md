# 🏆 Trido — AI Digital Classroom Judge Installation & Evaluation Guide

Welcome to the **Trido** evaluation guide. Trido is an AI-powered smart digital classroom designed specifically for interactive whiteboards and offline/hybrid classroom environments. 

This guide provides clean, step-by-step instructions in English on how to install, configure, and launch Trido for evaluation.

---

## ✨ What's New in this Update?
1. **Dynamic Model Selection UI:** Accessible directly from the **Settings** gear icon on the board. You can now choose from pre-loaded models for each provider.
2. **Google Gemini (Cloud):** Select standard and next-generation models including:
   - `gemini-3.5-flash-lite` (Default - Recommended)
   - `gemini-3.5-flash` (High Intelligence)
   - `gemini-3.1-flash-lite` (Ultra-fast)
   - `gemini-2.5-flash` & `gemini-2.5-pro`
   - Custom environment overrides via `GEMINI_MODEL`.
3. **Vertex AI (Enterprise Cloud):** Connect directly to enterprise-grade Google Cloud projects with:
   - `gemma-4-31b-it` (Next-gen Gemma 4 31B)
   - `gemini-2.5-flash` / `gemini-2.5-pro`
4. **Ollama (100% Offline/Local AI):** Run privately and with zero internet. Optimized for:
   - `gemma4:31b` (Recommended Offline Model)
   - `gemma4:e2b` (Lightweight Gemma 4 - default)
   - Supports auto-detection and custom model additions.

---

## 🛠️ Step-by-Step Installation & Run

### Option 1: Fast Launch with `start.bat` (Windows - Recommended)
Double-clicking the smart launcher handles everything automatically:
1. Locate the file **`start.bat`** in the root directory.
2. **Double-click `start.bat`**.
3. The script will:
   - Check if **Node.js** is installed (will open Nodejs.org in your browser if missing).
   - Install production dependencies automatically (`npm install`).
   - Start the production server on port `3000`.
   - Launch your default browser in **App Mode** (Chrome or Edge) at `http://localhost:3000` with a clean, native desktop look.

---

### Option 2: Manual Start (All Operating Systems)
If you prefer running commands manually via the terminal/powershell:
1. Open your terminal in the project directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Compile frontend and backend bundles:
   ```bash
   npm run build:all
   ```
4. Start the production server:
   ```bash
   npm start
   ```
5. Open your browser and navigate to `http://localhost:3000`.

---

## ⚙️ Environment Variables Configuration (`.env`)

To configure API keys or change defaults, rename `.env.example` to `.env` or edit the existing `.env` file in the root directory:

```bash
# ── AI Mode Selection ────────────────────────────────────────────────────────
# Choices: 'auto' | 'gemini' | 'ollama' | 'vertex'
AI_MODE=auto

# ── Google Gemini (Cloud) ────────────────────────────────────────────────────
# Get a free API key at: https://aistudio.google.com/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# Standard options or secret/test models: gemini-3.5-flash, gemini-3.1-flash-lite
GEMINI_MODEL=gemini-3.5-flash-lite

# ── Ollama (Local/Offline) ───────────────────────────────────────────────────
# Ensure Ollama is running and download your model of choice:
# e.g., "ollama pull gemma4:e2b" or "ollama pull gemma4:31b"
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=gemma4:e2b

# ── Vertex AI (Google Cloud Enterprise) ──────────────────────────────────────
# Set up your GCP project details if utilizing Vertex AI
GOOGLE_CLOUD_PROJECT=your-gcp-project-id
VERTEX_LOCATION=us-central1
```

---

## 🧭 Evaluation Checklist for Judges
Once the app is open:
1. **Open Settings:** Click the **Gear icon** in the top corner of the screen.
2. **Profile Name:** Enter your name to customize your boarding session.
3. **Configure AI:**
   - Under **Mode AI**, select your preferred provider (**Gemini**, **Ollama**, or **Vertex AI**).
   - Change models on the fly with the newly added **Model Dropdowns**.
   - Press **Test Connection (Test Koneksi AI)** to verify status dynamically.
   - Click **Save (Simpan)** to apply.
4. **Test the Board:**
   - Try creating a Mindmap, compiling a Quiz, or writing Markdown summaries.
   - Speak to Trido via real-time microphone voice input (Voice Island).
