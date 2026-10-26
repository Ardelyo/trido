# Changelog

## [Unreleased]

### Changed
- Unified motion system in `design/motion.ts` (spring/tween/variants); all UI now uses `motion/react` (removed `framer-motion` imports) with `MotionConfig reducedMotion="user"`.
- Brand colours, shape and elevation are now theme tokens (`bg-trido`, `text-ink`, `bg-sun`, `rounded-sheet`, `shadow-float`); added `.touch-target` utility; `h-screen` → `h-dvh`.
- Smartboard dock uses pointer events (touch-friendly magnification).

### Mobile web
- App is usable on phones and portrait/landscape tablets: header no longer clips, undo/redo/delete/zoom and page switcher are available on small canvases, voice bar fits narrow screens, sidebar closes after navigation and includes Share, floating tools clamp to the viewport, safe-area insets and `overscroll-behavior` set.
- Canvas overlay layout is driven by container queries (`@4xl`), so it adapts to the canvas width (also fixes narrow desktop windows with the sidebar open); the desktop layout at >= 896px canvas width is unchanged.

### AI precise editing
- New `edit_component` tool (Express adapters + Vercel `api/ai/generate.ts`): one-operation edits instead of rewriting a component — documents (insert/replace/delete/move block, append to section), diagrams (add/rename/delete/move node for mermaid mindmap, flowchart and markmap), quizzes (question/options/correct answer, per-question), todo & attendance lists.
- Pure, unit-tested engine in `utils/boardEdit.ts` (34 tests): deterministic results across models, ambiguity detection with candidate lists, 1-based indexes, sanitizer-safe diagrams.
- The AI now receives an addressable outline of every component (block ids, node names, numbered items) and validation recovers from wrong ids instead of failing the turn.
- Each AI turn is one transaction: one-tap **Batalkan** undo (`AiResultBar`), failure summary in chat, edit chips on replies, contextual suggestion chips, and live progress (n/m + current step) in the dynamic island.
- Todo widget now follows/persists its config so AI and user edits stay in sync.

### Zoom & navigation (desktop)
- Wheel zoom now works over DOM widgets as well as the canvas (Ctrl/Cmd+wheel and trackpad pinch always zoom and no longer trigger browser page-zoom; a plain wheel scrolls widget content first, then zooms the board).
- Middle-button or Space+drag pans even when the cursor is over a widget.
- Wheel deltas are normalised across browsers; zoom buttons/keys step 25% (was 10%); `Ctrl +/-/0` handled; `1` fits content; the "fit to screen" button now really fits all content.

### Refactor
- `ExportDialog` export/import logic extracted to `hooks/useBoardExport.ts`; `CanvasManager` drag & drop extracted to `hooks/useCanvasDrop.ts`.
- Dialog radii/transitions use `rounded-sheet` and `tween` presets.

### Added (Desktop .exe)
- Auto-update via `electron-updater` (GitHub Releases; release workflow now uploads `latest*.yml` + blockmaps) with in-app notice.
- Tests for smartboard dock and native save bridge.
- Single-instance lock, free-port fallback, navigation guard, security headers, IPC sender validation, file logging, window-state persistence, F11 fullscreen.
- Typed `window.electronAPI` (`getAppInfo`, `toggleFullscreen`, `saveFile`, `openFile`); exports use the native Save dialog in the desktop app.
- ESLint (lenient), Prettier and EditorConfig; `puppeteer` moved to devDependencies.


All notable changes to **Trido — AI Smartboard for Inclusive Classroom Education** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.0] — 2026-10-14

### Added
- **5-Layer Deterministic Mermaid Sanitizer & Self-Healing Engine (`utils/mermaidSanitizer.ts`, `components/MermaidTool.tsx`)**:
  - Automatically strips unescaped parentheses, brackets, colons, quotes, and Markdown bullets inside `mindmap` child nodes.
  - Enforces a single `root((Title))` node at 2 spaces and clamps child indentation (`>= 4` spaces, max `+2` spaces per level) to eliminate `"There can be only one root"` and indentation parse errors.
  - Auto-quotes `flowchart` labels containing parentheses or colons (`A["Fase 1 (Inisiasi): ATP"]`).
  - Adds a 2-stage self-healing renderer fallback (`buildSafeMindmapFromRawText`) so malformed LLM diagrams repair themselves automatically without displaying error cards in class.
- **Standalone Windows Desktop Installer (`Trido-Setup-1.0.0.exe`)**:
  - Packaged full offline-capable Electron + Express + Socket.IO + Faster-Whisper desktop application (`dist-release/Trido Setup 1.0.0.exe`).
  - Configured `"asar": false` and `"signAndEditExecutable": false` to preserve compatibility with Windows 11 Smart App Control (24H2).
  - Designed tactile IKEA-minimalist desktop intro/splash screen (`electron/splash.html`) with 3-step horizontal progress animations and rotating pedagogical tips.
- **Spoken Number Normalization & Conversational Reflex Engine (`hooks/useGeminiBrain.ts`, `hooks/useAmbientListener.ts`)**:
  - Added `normalizeSpokenNumbers` (Indonesian & English spoken numbers `"lima belas menit"` -> `15 menit`) and `stripConversationalPrefix` (`"Halo Trido, tolong..."`).
  - Upgraded Jev-1 `<15ms` Reflex Engine to handle spoken timer durations, page creation, undo/redo, periodic table, unit converter, and in-place diagram target locking.
- **Unified Voice Mode & Chat Mode Synchronization (`components/ChatInterface.tsx`, `App.tsx`, `store.ts`)**:
  - Bidirectional synchronization of `chatInputText`, `interimInputText`, and `isVoiceListening` between the Canvas Voice Island and the `Asisten` Sidebar Drawer.
  - Added `'execute-voice-prompt'` custom event dispatch so hands-free ambient classroom commands (`useAmbientListener.ts`) execute end-to-end automatically.
- **PWA Manifest & Service Worker (`public/manifest.json`, `public/sw.js`)**:
  - Added valid Web App Manifest and Service Worker assets, synchronized with the official Smartboard logo across all icon resolutions (`icon.ico`, `pwa-512x512.png`, `pwa-192x192.png`, `apple-touch-icon.png`).
- **Automated Test Suites (`tests/smartboardSyncAndVoiceChat.test.ts`, `tests/mermaidMindmap.test.ts`, `tests/rootRouter.test.ts`)**:
  - Expanded automated Vitest test coverage to **17 test suites (126 passing tests)**.

### Changed
- **120 FPS Tactile Animation Smoothness (`components/DomOverlay.tsx`, `components/ProcessingStatusHud.tsx`)**:
  - Upgraded DOM widget transforms to GPU-composited `translate3d(-50%, -50%, 0)` with `backfaceVisibility: 'hidden'` and `transition: 'none'` during RAF drag/resize.
  - Added 3-step horizontal progress trace and rotating pedagogical insights to `ProcessingStatusHud.tsx`.
- **11-Language Localization & Fallback Priority (`utils/translations.ts`, `components/landing/i18n.tsx`)**:
  - Fixed `t(key, fallback)` resolution order so non-Indonesian languages (`en`, `ar`, `zh`, `fr`, `ru`, `es`, `ja`, `ko`, `de`, `pt`) prioritize `translations['en']` before Indonesian fallback strings.
  - Synchronized Landing Page language toggle (`ID`/`EN`) directly with the Smartboard store (`useStore.getState().setLanguage`).
  - Fixed Indonesian typography line-height (`1.06`) and Hero right-padding (`lg:pr-48`) on the Landing Page to prevent heading overlaps.

### Fixed
- **Full-Stack Security & Bug Audit Remediations (54 Findings Resolved)**:
  - **SSRF Prevention**: Added `sanitizeOllamaUrl` allowlist validation across `server/aiRouter.ts`, `server/ollamaAdapter.ts`, and `api/ai/*`.
  - **Iframe Sandbox Escape**: Removed `allow-same-origin` from `<iframe srcDoc>` in `components/AppBuilderTool.tsx`.
  - **React Rules of Hooks**: Moved early viewer return below all 15 React Hooks in `components/ChatInterface.tsx`.
  - **Hardware Mic & Web Audio Leaks**: Stopped `MediaStream` tracks in `stopVisualizer()` (`ChatInterface.tsx`) and closed/reused `AudioContext` instances in `SpinWheelTool.tsx`, `AttendanceTool.tsx`, and `utils/sounds.ts`.
  - **Multi-Page DOM Synchronization**: Fixed race condition in `store.ts` and `CanvasManager.tsx` where switching pages overwrote the outgoing page's `domElements` with `{}`.
  - **Vertex Audio Transcription Argument Order**: Fixed positional arguments in `transcribeAudioVertex(cleanAudio, audioMimeType, selectedVertexModel)` in `server/aiRouter.ts`.
  - **Windows `start.bat` Launcher**: Removed POSIX `NODE_ENV=production` prefix from `package.json` `"start"` script and upgraded `start.bat` for 1-click Windows `cmd.exe` execution.

---

## [1.0.0] — 2026-05-17

### Added
- Initial public release of **Trido — AI-Powered Digital Classroom** built in collaboration with **Pak Damar** (Bandung, Indonesia).
- Voice-first infinite whiteboard powered by Fabric.js, React 19, Zustand, Express, and Socket.IO.
- Hybrid Cloud & Offline AI support (Google Gemini, Vertex AI, local Ollama, and Faster-Whisper offline speech-to-text).
- Interactive classroom tools: Mindmap, 4 Quiz types, Document/KaTeX renderer, Timer, Calculator, Unit Converter, Periodic Table, Attendance, Spin Wheel, Scoreboard, and Math Graph.
