# 🚀 Trido v1.0.0 — Official Live Demo Release

Welcome to the official **Trido v1.0.0** desktop release! Designed specifically for live demonstrations, judging panels, and interactive classroom sessions, this release brings the entire AI-powered smart classroom platform into a fast, portable, and zero-configuration desktop package.

---

## ✨ Key Highlights

### 🌟 Frictionless Demo Launchers (`start.bat` & `start.sh`)
- **Zero-Dependency Setup:** Judges do not need any terminal knowledge or pre-configured environments. Double-clicking `start.bat` (Windows) or `start.sh` (macOS/Linux) automatically verifies Node.js, installs dependencies offline if missing, and boots the backend in seconds.
- **Native App Mode:** Automatically detects **Google Chrome** or **Microsoft Edge** on the host machine and launches Trido in dedicated `--app` mode (removing URL bars and browser tabs) for an immersive, native desktop feel.
- **100% Web Speech API Support:** By utilizing native browser engines through the smart launcher, voice recording and real-time voice transcription function flawlessly with zero API configuration needed.

### 🎙️ Upgraded Voice Island & Copilot UI
- **Dynamic Upward Expansion:** The floating Voice Island bar has been re-engineered for maximum canvas visibility. Long live transcripts and status notices now smoothly animate into a floating upward card rather than stretching across your workspace.
- **Collapsible Transcripts:** Easily toggle the transcript display on or off while maintaining active AI listening.
- **Visual Feedback:** Integrated real-time audio waveform visualizers that react dynamically to teacher input.

### ⚡ Optimized Standalone Engine
- **Lightweight Backend Bundle:** The Express backend and socket server have been streamlined into an ultra-compact `604 KB` bundle (down from 4.7 MB) by stripping heavy development dependencies.
- **Offline / Local AI Readiness:** Jump straight into interactive whiteboard sessions or use local AI models without being forced through mandatory API key setup gates on first run.

---

## 📦 What's in this Release?

When downloading from GitHub Releases, you have access to four pre-built distribution formats:

1. **`Trido-v1.0.0-portable.zip` (🌟 Highly Recommended for Judges)**
   - Unzip anywhere (USB drive, Desktop) and double-click `start.bat` (Windows) or `start.sh` (macOS/Linux). No installation required.
2. **`Trido Setup 1.0.0.exe`**
   - Native Windows standalone installer.
3. **`Trido-1.0.0-mac.dmg`**
   - Native macOS drag-and-drop application bundle.
4. **`Trido-1.0.0-linux.AppImage`**
   - Standalone single-file executable for Linux desktop environments.

---

## 🛠️ Quick Start Guide for Judges

1. Download **`Trido-v1.0.0-portable.zip`** from the release assets below.
2. Extract the folder to your Desktop.
3. Open the folder and double-click **`start.bat`** (on Windows).
4. Enjoy your live demo of **Trido — AI Digital Classroom**!

---
*Built with ❤️ by the Trido Team for live interactive education.*
