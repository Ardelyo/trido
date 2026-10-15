# Trido — AI-Powered Smartboard for Inclusive Classroom Education

[![CI — Typecheck, Test & Build](https://github.com/Ardelyo/trido/actions/workflows/ci.yml/badge.svg)](https://github.com/Ardelyo/trido/actions/workflows/ci.yml)
[![Release v1.1.0](https://img.shields.io/badge/release-v1.1.0-1550aa?style=flat-square)](https://github.com/Ardelyo/trido/releases/latest)
[![Windows Desktop .exe](https://img.shields.io/badge/Windows_Desktop-.exe_Installer-ffcc00?style=flat-square&logo=windows&logoColor=0a1a3a)](https://github.com/Ardelyo/trido/releases/latest/download/Trido-Setup-1.0.0.exe)
[![Tests](https://img.shields.io/badge/tests-126%20passing%20(17%20suites)-10b981?style=flat-square)](#testing--quality-gates)
[![License: MIT](https://img.shields.io/badge/license-MIT-0a1a3a?style=flat-square)](./LICENSE)

> *"Technology is abundant. But the people who actually care about inclusion — those are rare."*

**Trido** (**Tri**: *Teacher, Student, Technology* + **Do**: *Make it work, make it matter*) is a voice-first, AI-powered spatial smartboard built for educators — especially teachers with physical disabilities whom standard mouse-and-keyboard software leaves behind.

- **🌐 Live Web App:** [trido.vercel.app](https://trido.vercel.app)
- **🪟 Download Windows Desktop App (`.exe`, 168 MB):** [Trido-Setup-1.0.0.exe](https://github.com/Ardelyo/trido/releases/latest/download/Trido-Setup-1.0.0.exe) *(Standalone — no Node.js or terminal required)*
- **📚 Documentation Hub:** [`docs/README.md`](./docs/README.md)
- **🏆 Recognition:** **2nd Place Worldwide** — *Gemma 4 Good Hackathon by Google*

---

## 1. The Story Behind Trido

This project did not start from a pitch deck. It started from watching a real teacher in a real classroom.

**Pak Damar** (*Dadan Mochammad Ramdhan*) is a Bahasa Indonesia teacher in Bandung, Indonesia. He teaches with passion, patience, and depth while living with physical disabilities affecting both his hands and legs. Most digital whiteboards assume a user who can simultaneously click, drag, hold, resize, and type across tiny UI controls. Pak Damar shouldn't have to work around inaccessible software — he should just be able to teach.

We co-designed Trido with Pak Damar for real classroom instruction:
- **Zero-Touch Hands-Free Voice Control:** Speak naturally (`"Trido, buat peta konsep tentang fotosintesis"`, `"Pasang timer sepuluh menit"`).
- **Continuous In-Place Board Mutation:** Say `"Tambahkan cabang baru pada peta konsep tadi"` and Trido updates the existing diagram in-place instead of dumping duplicate widgets.
- **100% Offline Local AI Capability:** Works without internet in Indonesian schools using local Ollama (`trido-model:latest`, `trido-gemma:2b`, `gemma4:e2b`, `ornith-1.5:9b`) and offline Faster-Whisper speech-to-text.

---

## 2. Quick Start (3 Ways to Run)

### Option A — Windows Desktop Installer (`.exe`) *(Recommended for Teachers & Judges)*
1. Download **[Trido-Setup-1.0.0.exe](https://github.com/Ardelyo/trido/releases/latest/download/Trido-Setup-1.0.0.exe)**.
2. Run the installer and open **Trido** from your Desktop.
3. No Node.js, Python, or terminal required — the embedded server and canvas launch automatically.

### Option B — 1-Click Localhost Launcher (`start.bat` on Windows)
1. Clone or unzip this repository.
2. Double-click **`start.bat`**.
3. It checks Node.js, installs dependencies on first run, starts the server on `http://localhost:3000`, and opens the Smartboard in Chrome/Edge.

### Option C — Developer CLI (Windows / macOS / Linux)
```bash
git clone https://github.com/Ardelyo/trido.git
cd trido
npm install
cp .env.example .env
npm run dev
```
Open **`http://localhost:3000/?app=true`** for the Smartboard (or **`http://localhost:3000`** for the Landing Page).

---

## 3. AI Model & API Key Configuration

Trido supports a **Hybrid Cloud + 100% Offline Local AI** architecture configurable directly from **Settings (⚙️) → AI Configuration**:

| Mode | Model(s) | Requirements | Cost & Privacy |
|------|----------|--------------|----------------|
| **🏠 Ollama Local (Offline)** | `trido-model:latest` (9B Flagship)<br>`trido-gemma:2b` / `gemma4:e2b` (Edge) | [Ollama](https://ollama.com) installed locally (1-click download inside Settings) | **100% Free Forever & 100% Offline** |
| **✨ Google Gemini Cloud** | `gemini-3.8-flash` (Default)<br>`gemini-2.5-flash` / `gemini-2.5-pro` | Personal [Google AI Studio API Key](https://aistudio.google.com/apikey) (`GEMINI_API_KEY`) | Free tier available; key stored locally in browser |
| **🌐 Vertex AI (Demo / Enterprise)** | `gemini-3.8-flash`<br>`gemma-4-31b-it` | `GOOGLE_CLOUD_PROJECT` (Built-in `gemma4good` demo project enabled for evaluation) | Evaluation demo *(Note: built-in demo cloud will not be free forever; use Ollama Local or a personal API key for long-term use)* |

### Pulling Local Trido Models via Ollama
```bash
ollama pull trido-model:latest
# or lightweight edge model (2.5 GB):
ollama pull gemma4:e2b
```
*(You can also download and calibrate these models in **1 click** directly inside Trido's Settings menu.)*

---

## 4. System Architecture

```text
Teacher Input (Voice / Hands-Free / Chat / Document Upload)
   │
   ├─► Spoken Number & Prefix Normalizer ("lima belas menit" → "15 menit")
   │
   ├─► Jev-1 Reflex Engine (<15ms, Zero LLM Roundtrip)
   │     ├── Instant Classroom Tools (Timer + custom duration, Calculator, Attendance, Spin Wheel, Scoreboard)
   │     ├── Canvas & Page Controls (Zoom, Reset View, Add Page, Undo / Redo)
   │     └── In-Place Diagram Target Locking (locks onto active Mermaid/Markmap ID for modifications)
   │
   └─► System 2 Agentic Brain (Ollama Local / Gemini Cloud / Vertex AI)
         ├── Intent Classifier ('navigation' | 'modification' | 'question' | 'creation')
         ├── Tool Call Validator & Auto-Fixer (server/aiTools.ts + hooks/useGeminiBrain.ts)
         ├── 5-Layer Deterministic Mermaid AST Sanitizer & Self-Healing Renderer (utils/mermaidSanitizer.ts)
         ├── Spatial Occupancy Grid & Bezier Agent Cursor (services/spatialOccupancyGrid.ts)
         └── Real-Time Socket.IO Delta Broadcast (hooks/useSocketSync.ts → Student Viewers)
```

### Key Architectural Highlights
- **120 FPS Tactile Minimalism:** GPU-composited `translate3d(-50%, -50%, 0)` DOM widget overlay (`components/DomOverlay.tsx`) with `transition: none` during `requestAnimationFrame` drag/resize.
- **5-Layer Zero-Syntax-Error Mermaid Engine (`utils/mermaidSanitizer.ts`):** Deterministically strips unescaped parentheses, brackets, colons, and Markdown bullets in mindmap child nodes, enforces a single `root((Title))` node, quotes special flowchart labels, and self-heals corrupted diagrams automatically.
- **Multilingual & UN Language Support (`utils/translations.ts`):** Full interface and voice (STT/TTS) localization across **11 languages** (`id`, `en`, `ar`, `zh`, `fr`, `ru`, `es`, `ja`, `ko`, `de`, `pt`) + offline Faster-Whisper (`server/whisperService.py`) for 99+ languages.

---

## 5. Project Structure

```text
trido/
├── App.tsx                         # Main Smartboard shell, header, left navigation & Asisten drawer
├── store.ts                        # Zustand global state (multi-page sync, DOM widgets, AI & voice state)
├── types.ts                        # Shared TypeScript interfaces & Socket.IO event contracts
├── constants.ts                    # Central model, timeout & server configuration
├── server.ts                       # Express + Socket.IO real-time server & Vite middleware
├── start.bat                       # 1-click Windows localhost launcher
│
├── components/
│   ├── CanvasManager.tsx           # Fabric.js infinite canvas, multi-page state & undo/redo stack
│   ├── DomOverlay.tsx              # 120 FPS GPU-composited widget overlay & Fullscreen Focus Portal
│   ├── ChatInterface.tsx           # Voice Island, Web Speech + Faster-Whisper STT & toolbar bridge
│   ├── MermaidTool.tsx             # Interactive SVG Mermaid Mindmap & Flowchart renderer + live editor
│   ├── ProcessingStatusHud.tsx     # IKEA-style 3-step horizontal progress HUD & pedagogical tips
│   ├── SettingsView.tsx            # AI provider config, 1-click Ollama model downloader & i18n settings
│   ├── ExportDialog.tsx            # Multi-format export (PNG, SVG, PDF, Markdown, HTML, Moodle GIFT)
│   ├── landing/                    # Bilingual (ID/EN) interactive product landing page
│   ├── smartboard/                 # Dock, Radial & Classic toolbar layout modes
│   └── *Tool.tsx                   # 11 built-in classroom tools (Timer, Quiz, Notes, Periodic Table, etc.)
│
├── hooks/
│   ├── useGeminiBrain.ts           # Jev-1 Reflex Engine, Intent Classifier & System 2 tool orchestration
│   ├── useAgentProcessor.ts        # Sequential async action queue executor & Bezier cursor animation
│   ├── useAmbientListener.ts       # Hands-free classroom voice listener ("Trido, ...")
│   ├── useSocketSync.ts            # Host ↔ Viewer real-time canvas, viewport & DOM delta sync
│   └── useAiStatus.ts              # Live AI provider & Ollama model status polling
│
├── server/
│   ├── aiRouter.ts                 # /api/ai/* Express router with SSRF protection & status caching
│   ├── aiTools.ts                  # Function declarations, system prompt builder & tool call validator
│   ├── ollamaAdapter.ts            # Local Ollama REST adapter & streaming model pull
│   ├── geminiAdapter.ts            # Google AI Studio (@google/genai) adapter
│   ├── vertexAdapter.ts            # Google Cloud Vertex AI adapter
│   ├── whisperAdapter.ts           # Node ↔ Python Faster-Whisper bridge
│   └── whisperService.py           # Offline Faster-Whisper (CTranslate2) speech-to-text service
│
├── utils/
│   ├── mermaidSanitizer.ts         # 5-layer deterministic Mermaid AST sanitizer & self-healing fallback
│   ├── mindmapLayout.ts            # Hierarchical mindmap node layout engine
│   ├── smartExport.ts              # XSS-safe HTML, Markdown, Printable Worksheet & GIFT exporters
│   ├── documentParser.ts           # Client/server PDF, DOCX, PPTX, XLSX & text parser
│   ├── translations.ts             # 11-language i18n dictionary & fallback resolver
│   └── sounds.ts                   # Web Audio API synthesized UI & voice feedback
│
├── electron/                       # Standalone desktop app (main.ts, preload.ts, splash.html, setup.html)
├── api/                            # Vercel serverless API functions (/api/ai/*, /api/health)
├── tests/                          # 17 Vitest unit & integration test suites (126 tests)
└── docs/                           # Comprehensive technical, pedagogical & research documentation
```

---

## 6. Testing & Quality Gates

All pull requests and commits to `main` are validated by [`.github/workflows/ci.yml`](./.github/workflows/ci.yml):

```bash
npm run check          # Strict TypeScript compilation check (tsc --noEmit)
npx vitest run         # Run all 17 Vitest test suites (126 tests)
npm run build          # Build production frontend & PWA bundle (dist/)
npm run build:electron:win  # Package Windows installer (dist-release/Trido Setup 1.0.0.exe)
```

---

## 7. Documentation Hub

See **[`docs/README.md`](./docs/README.md)** for the full index. Key documents:

| Category | Document | Description |
|----------|----------|-------------|
| **Quick Start & Judging** | [`JURY_INSTALL_GUIDE.md`](./JURY_INSTALL_GUIDE.md) | Step-by-step installation, `.exe` setup & evaluation checklist |
| **Educator Guides** | [`docs/TEACHER_GUIDE.md`](./docs/TEACHER_GUIDE.md) · [`docs/USAGE.md`](./docs/USAGE.md) | Classroom workflows, voice commands & widget guide for teachers |
| **Comprehensive Manual** | [`docs/TRIDO_COMPREHENSIVE_GUIDE_ID.md`](./docs/TRIDO_COMPREHENSIVE_GUIDE_ID.md) · [`EN`](./docs/TRIDO_COMPREHENSIVE_GUIDE_EN.md) | Full end-to-end documentation in Bahasa Indonesia & English |
| **Architecture & API** | [`docs/API_DOCUMENTATION.md`](./docs/API_DOCUMENTATION.md) · [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) | REST endpoints (`/api/ai/*`), Socket.IO events, Docker & Electron packaging |
| **AI Research & Models** | [`docs/TRIDO_MODEL_FINE_TUNING_RESEARCH_REPORT.md`](./docs/TRIDO_MODEL_FINE_TUNING_RESEARCH_REPORT.md) | Teacher-Student distillation (`trido-model:latest` & `trido-gemma:2b`) & benchmarks |
| **Governance & Security** | [`CONTRIBUTING.md`](./CONTRIBUTING.md) · [`SECURITY.md`](./SECURITY.md) · [`CHANGELOG.md`](./CHANGELOG.md) | Contribution rules, security architecture & release changelog |

---

## 8. License & Official Copyright

```text
TRIDO 2026
Hak Cipta Terdaftar Kementerian Hukum Republik Indonesia
(Ministry of Law, Republic of Indonesia)
Copyright (c) 2026 TRIDO by Ardellio Satria Anindito
```

- **Source Code & Software:** Licensed under the [MIT License](./LICENSE).
- **Documentation & Research Deliverables:** Licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
- **AI Models:** Gemma models are subject to the [Gemma Terms of Use](https://ai.google.dev/gemma/terms).
