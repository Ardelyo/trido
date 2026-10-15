# 🚀 Trido v1.1.0 — Official Desktop (`.exe`), 120 FPS Smartboard & Self-Healing Mermaid Release

Welcome to **Trido v1.1.0**! This release packages the complete voice-first AI Smartboard into a standalone Windows desktop installer (`Trido-Setup-1.0.0.exe`), introduces the 5-Layer Self-Healing Mermaid Mindmap Engine, and completes a comprehensive 54-point security and performance audit.

---

## ⬇️ Direct Downloads

| Platform | Asset | Description |
|----------|-------|-------------|
| **🪟 Windows Desktop Installer** | [**`Trido-Setup-1.0.0.exe`**](https://github.com/Ardelyo/trido/releases/latest/download/Trido-Setup-1.0.0.exe) | **Recommended (168 MB):** 1-click Windows x64 installer. Compatible with Windows 11 Smart App Control. No Node.js or terminal required. |
| **🪟 Windows 1-Click Localhost** | `start.bat` (in repo) | Fast local launcher for source checkouts — auto-detects running server and opens `http://localhost:3000/?app=true`. |

---

## ✨ What's New in v1.1.0

1. **5-Layer Zero-Syntax-Error Mermaid Mindmap Engine (`utils/mermaidSanitizer.ts`)**
   - Automatically sanitizes LLM syntax quirks (parentheses inside child nodes, colons, quotes, Markdown bullets, duplicate roots, and indentation jumps) and includes a 2-stage self-healing renderer fallback in `MermaidTool.tsx`.
2. **120 FPS Tactile IKEA Minimalism & Smooth Animations**
   - GPU-composited `translate3d` widget transforms with `transition: none` during RAF dragging/resizing, plus a 3-step horizontal progress HUD with rotating pedagogical tips.
3. **Unified Voice Mode & `Asisten` Sidebar Synchronization**
   - Spoken number normalization (`"lima belas menit"` -> `15 menit`), conversational prefix stripping, accurate intent classification (`navigation` vs `modification` vs `question` vs `creation`), and live voice recording inside both the Canvas Voice Island and the `Asisten` sidebar.
4. **11-Language Localization & Offline Faster-Whisper STT**
   - Full UI, STT, and TTS support across Indonesian, English, Arabic, Chinese, French, Russian, Spanish, Japanese, Korean, German, and Portuguese.
5. **1-Click Local Trido Model Downloader & API Key Reminder**
   - Built-in `gemma4good` Cloud Demo is supported for evaluation (with clear in-app reminders that it will not be free forever), alongside 1-click local Ollama model downloading (`trido-model:latest` & `trido-gemma:2b`) and personal `GEMINI_API_KEY` support.

---

See [**`CHANGELOG.md`**](./CHANGELOG.md) for the full list of security and engineering fixes.
