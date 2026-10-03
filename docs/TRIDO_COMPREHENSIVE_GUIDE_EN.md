# TRIDO SMARTBOARD: OFFICIAL COMPREHENSIVE GUIDE & MANUAL
**Copyright © 2026 TRIDO by Ardellio Satria Anindito**  
*Registered Copyright with the Ministry of Law, Republic of Indonesia*  
*2nd Place Worldwide · Gemma 4 Good Hackathon by Google*

---

## TABLE OF CONTENTS
1. [Philosophy, Brand Identity & Design Standards](#1-philosophy-brand-identity--design-standards)
2. [Smart Launch & Contextual Routing System](#2-smart-launch--contextual-routing-system)
3. [Digital Canvas Engine & Precision Drawing Tools](#3-digital-canvas-engine--precision-drawing-tools)
4. [Hands-Free Ambient Voice Engine & Pak Damar Inclusive Standard](#4-hands-free-ambient-voice-engine--pak-damar-inclusive-standard)
5. [The 12 Interactive Classroom Widgets & STEM Simulations](#5-the-12-interactive-classroom-widgets--stem-simulations)
6. [Widget Ergonomics, 120 FPS Zero-Lag Dragging & "Pin to Board"](#6-widget-ergonomics-120-fps-zero-lag-dragging--pin-to-board)
7. [AI Intelligence Core: Multi-Model Routing & Continuous In-Place Mutation](#7-ai-intelligence-core-multi-model-routing--continuous-in-place-mutation)
8. [Real-Time Collaboration, Session Management & Smart Export](#8-real-time-collaboration-session-management--smart-export)
9. [Step-by-Step 45-Minute Interactive Classroom Playbook](#9-step-by-step-45-minute-interactive-classroom-playbook)
10. [Keyboard Shortcuts Cheat Sheet & Troubleshooting](#10-keyboard-shortcuts-cheat-sheet--troubleshooting)

---

## 1. PHILOSOPHY, BRAND IDENTITY & DESIGN STANDARDS

TRIDO was conceived around a fundamental classroom reality: **teachers teach students, not laptop screens.**

### 1.1 Tactile Scandinavian / IKEA Design Principles
- **Natural Warm Paper Shell (`#e4e3e0`)**: The application's outer frame uses a warm paper tone that eliminates eye strain, inspired by physical notebooks and Scandinavian modular furniture manuals.
- **Pure White Canvas Stage (`#ffffff`)**: The primary writing stage is rendered as a clean white card with generous circular corners (`rounded-[2.8rem]`) and a subtle boundary line (`border-2 border-[#1550aa]/15`).
- **Solid Trido Blue (`#1550aa`)**: The primary brand color—bold, assertive, and hyper-legible under any classroom projector or ambient sunlight.
- **Sun Yellow Accent (`#ffcc00`)**: Tactile visual signals for active states, live microphone pulses, and highlight markers.
- **High-Contrast Dark Ink (`#0a1a3a`)**: Razor-sharp typography featuring `Inter Tight` for display titles, `Work Sans` / `Inter` for body text, and `JetBrains Mono` for calculations and code.
- **Strict Zero-Gradient Standard**: Multicolored gradients on logos and controls are strictly forbidden. High-contrast solid tones and subtle pastels ensure instant recognition on low-contrast classroom projectors.

---

## 2. SMART LAUNCH & CONTEXTUAL ROUTING SYSTEM

TRIDO features an adaptive routing controller (`RootRouter.tsx`) that automatically identifies its deployment context:

### 2.1 Local Classroom / Dev / Desktop Launch Mode
- **URL Host**: `http://localhost:3030` (or dev ports `3000`/`3001`/`5173`) or within the Electron desktop executable.
- **Behavior**: **Zero Barrier**. The system immediately renders the interactive Smartboard Canvas (`<App />`) within milliseconds, bypassing promotional landing pages so teachers can start their lesson instantly.

### 2.2 Public Web Mode (`trido.vercel.app`)
- **Root URL (`/`)**: Displays the official TRIDO Showcase Landing Page highlighting the voice demo, global Google Hackathon honors, feature breakdowns, and bilingual toggle (ID/EN).
- **Cinematic Transition Curtain**: Clicking **"Launch Smartboard"** runs a smooth transition:
  1. The showcase page gently blurs and scales back (`scale: 0.985, filter: blur(6px)`).
  2. A solid Trido blue curtain presents a pulsing logo badge with the message *"Opening Digital Classroom..."*.
  3. The route transitions to `/app` and the canvas unveils smoothly with zero page reloads.
- **Direct Deep-Links**: Visiting `/app` or a shared collaboration link like `?room=math8a` opens the canvas immediately.
- **Return Navigation**: On the public web, the Trido header brand and the *"About / Home"* sidebar button allow visitors to return to the landing page at any time.

---

## 3. DIGITAL CANVAS ENGINE & PRECISION DRAWING TOOLS

Built upon an optimized, hardware-accelerated Fabric.js core:

### 3.1 Vertical Floating Tool Pill
Floats on the left edge of the canvas as a circular pill container (`rounded-full`):
- **Select Element (`SELECT`, Shortcut: `V`)**: Select objects, drag cards, and adjust layouts.
- **Digital Pen (`PENCIL`, Shortcut: `P`)**: Smooth handwriting utilizing the *perfect-freehand* algorithm for realistic ink dynamics.
- **Eraser (`ERASER`, Shortcut: `E`)**: Remove ink strokes and geometric shapes cleanly.
- **Text & Formula (`TEXT`, Shortcut: `T`)**: Type academic explanations with typography support for `Inter`, `JetBrains Mono`, and `Source Serif 4`.
- **Geometric Shapes (`SHAPES`)**: Rectangles, Circles, Triangles, Stars, Polygons, Lines, Arrows, Diamonds, and Speech Bubbles.
- **Palette & Thickness Flyout**: A 1.75rem curved card offering 8 high-contrast colors and stroke widths from 2px to 32px.

### 3.2 28px Tactile Touch Hitboxes
- Selected canvas objects display crisp circular white corner handles with solid Trido blue borders (`cornerSize: 12px`).
- Configured with an **invisible 28px touch hitbox (`touchCornerSize: 28px`)**, enabling fingers and styluses to grab, rotate, and scale elements reliably without slipping.

---

## 4. HANDS-FREE AMBIENT VOICE ENGINE & PAK DAMAR INCLUSIVE STANDARD

Engineered specifically for inclusive classrooms and educators with motor or visual impairments:

### 4.1 Activating Hands-Free Mode
1. Locate the **Assistive Dock (Inclusive Mode)** in the bottom-right corner.
2. Tap the circular **"Voice"** button (microphone icon).
3. The button illuminates in vibrant sun yellow (`#ffcc00`), labeled **"Listen"**.
4. An ambient status pill appears above the dock: *"Hands-Free: 'Trido, ...'"*.

### 4.2 Spoken Command Intent Dictionary
Speak naturally in Indonesian or English:
- **Timer Spawning**:  
  *“Trido, set a 5 minute timer”* or *“Trido, pasang timer 10 menit”*  
  ➜ Creates a countdown timer widget with the specified duration and plays an audio chime.
- **Student Attendance**:  
  *“Trido, open attendance”* or *“Trido, presensi siswa”*  
  ➜ Immediately opens the class roster sheet.
- **Random Student Wheel**:  
  *“Trido, pick a student”* or *“Trido, acak giliran”*  
  ➜ Deploys the interactive spin wheel to the center of the board.
- **Scientific Calculator**:  
  *“Trido, open calculator”* or *“Trido, buka kalkulator”*  
  ➜ Opens the calculation tool alongside active notes.
- **Interactive Quiz**:  
  *“Trido, start a quiz”* or *“Trido, buat kuis”*  
  ➜ Activates the classroom quiz suite.
- **Center Screen / Reset Camera**:  
  *“Trido, center board”* or *“Trido, pusatkan layar”*  
  ➜ Resets the viewport camera to center at 100% zoom.
- **Clear Canvas**:  
  *“Trido, clear board”* or *“Trido, bersihkan papan”*  
  ➜ Clears drawings with an audio cue.
- **Mindmaps & AI Brain**:  
  *“Trido, make a mind map about photosynthesis”*  
  ➜ Forwards the intent to the AI Assistant to generate a live Mermaid mindmap.

---

## 5. THE 12 INTERACTIVE CLASSROOM WIDGETS & STEM SIMULATIONS

TRIDO features modular classroom tools that live directly on the canvas:

1. **⏱️ Timer & Countdown Tool**: Visual circular progress bar, pause/resume controls, and bell chimes.
2. **🧮 Scientific Calculator**: High-precision math keyboard with live expression history.
3. **📝 Academic Document Block**: Markdown reader with KaTeX math typesetting (`$$E = mc^2$$`) and code syntax blocks.
4. **❓ Interactive Quiz Suite**:
   - Multiple Choice
   - Essay Examination
   - True / False
   - Drag & Drop Matching
5. **⚗️ Interactive Periodic Table**: Complete chemical element map with atomic numbers, element groups, and electron configurations.
6. **⇄ Unit Converter Tool**: Instant conversion for length, mass, temperature, time, volume, and data metrics.
7. **👥 Student Attendance Roster**: Track Present, Absent, Sick, or Excused students with automatic summaries.
8. **☑️ Class Todo Checklist**: Real-time task manager for lesson agendas.
9. **🎲 Random Student Wheel**: Fair randomizer for selecting student presenters.
10. **🏆 Team Scoreboard**: Group competition tracker with victory celebrations.
11. **📈 Interactive Math Grapher**: Plot quadratic ($y = ax^2 + bx + c$), linear, sine, and cosine curves.
12. **🌳 Dynamic Mindmap (Mermaid / Markmap)**: Hierarchical topic maps with in-place node editing.
13. **🔬 STEM Lab Simulations**:
    - Chemistry Acid-Base Titration (pH indicator color transitions).
    - Physics Projectile Motion (cannon elevation angle, velocity, and distance).
    - Biology Punnett Square (genotype and phenotype genetics ratios).

---

## 6. WIDGET ERGONOMICS, 120 FPS ZERO-LAG DRAGGING & "PIN TO BOARD"

### 6.1 120 FPS Zero-Lag Dragging
- Grab any widget by its top titlebar handle.
- The card lifts with a subtle elevation (`scale: 1.018` with soft ambient drop shadow).
- Follows cursor movements with zero latency using `requestAnimationFrame` coalescing without CSS transition lag.

### 6.2 Tactile Corner Resize Handle
- Each widget features a corner mark at the bottom-right corner.
- Drag inward or outward to resize the card.
- A dynamic dimension badge (`[width] × [height]`) displays live pixel metrics during adjustment.

### 6.3 Grabbing AI Output to Canvas ("Pin to Board")
1. Ask the AI assistant a question (e.g., *"Summarize Newton's 3 Laws of Motion"*).
2. On the response message, click **"📌 Pin to Board"**.
3. The explanation appears on the canvas as an interactive document card.
4. Reposition, resize, or annotate around it using drawing pens.

---

## 7. AI INTELLIGENCE CORE: MULTI-MODEL ROUTING & CONTINUOUS IN-PLACE MUTATION

### 7.1 Multi-Model AI Routing
- **Google AI Studio (Gemini Cloud)**: Powered by `gemini-3.8-flash` for high-speed generation.
- **Google Cloud Vertex AI**: Integrated in the `gemma4good-494311` enterprise infrastructure.
- **Local Ollama (100% Offline & Private)**: Runs `gemma4:e2b` or `ornith-1.5:9b` locally on laptop GPUs without internet connectivity.

### 7.2 Continuous In-Place Mutation
Standard chatbots generate duplicate widgets, cluttering the screen. TRIDO mutates elements in place:
- Requesting: *"Add another branch about Dark Reactions to that mindmap"*, TRIDO **does not generate a second diagram**. It targets the existing diagram ID on the canvas and modifies its nodes directly.

---

## 8. REAL-TIME COLLABORATION, SESSION MANAGEMENT & SMART EXPORT

### 8.1 Student Viewer Mode (QR Code & Room IDs)
1. Tap **"Share"** in the top header.
2. Students scan the displayed **QR Code** or navigate to `trido.id/?room=ROOM_ID`.
3. Viewer Mode provides a clean, cinematic presentation view without confusing teacher controls.

### 8.2 Automatic Persistence & Session History
- Canvas strokes, documents, and tool positions auto-save to browser IndexedDB storage continuously.
- Access **"History"** in the left sidebar to resume past lessons with full fidelity.

### 8.3 Smart Multi-Format Export
Tap **"Save / Export"**:
- **HD Image (PNG/SVG)**: High-resolution 2x Retina export isolating drawings and widgets.
- **Printable Worksheet (PDF)**: Formats document notes and quizzes into clean A4 printable handouts.
- **Board Archive (`.trido`)**: Complete JSON backup for migration across devices.

---

## 9. STEP-BY-STEP 45-MINUTE INTERACTIVE CLASSROOM PLAYBOOK

### Minutes 00–05: Welcome & Hands-Free Attendance
1. Stand at the smartboard and enable **Hands-Free Mode**.
2. Speak: *“Trido, open attendance.”*
3. Check student names on the roster widget.
4. Speak: *“Trido, center board.”*

### Minutes 05–20: Lecture & Live AI Mindmapping
1. Speak or type: *“Trido, make a mind map about Cell Structure: Plant vs Animal Cells.”*
2. An interactive concept map populates the canvas center.
3. Switch to the Digital Pen (`P`) to highlight organelle differences in color.
4. For detailed notes, click **"Pin to Board"** on the AI assistant's summary.

### Minutes 20–35: Group Practice & Interactive Calculations
1. Speak: *“Trido, pick a student.”*
2. Spin the wheel to select a student presenter.
3. Speak: *“Trido, set a 10 minute timer.”*
4. Students solve exercises on the board while tracking the visual timer.

### Minutes 35–42: Rapid Evaluation with Interactive Quizzes
1. Open the Quiz tool.
2. Present 3 multiple-choice questions for class discussion.
3. Review scores and celebrate achievements.

### Minutes 42–45: Session Archival & Wrap-up
1. Open **"Export & Import"**.
2. Select **Export HD PNG** to share the whiteboard snapshot to Google Classroom.
3. Lesson state automatically persists in Session History.

---

## 10. KEYBOARD SHORTCUTS CHEAT SHEET & TROUBLESHOOTING

| Shortcut | Action / Feature |
| :--- | :--- |
| **`V`** | Select Tool / Object Pointer (`SELECT`) |
| **`P`** | Digital Drawing Pen (`PENCIL`) |
| **`E`** | Eraser (`ERASER`) |
| **`T`** | Insert Text Box (`TEXT`) |
| **`Space + Drag`** | Pan Viewport Canvas |
| **`Ctrl + Z` / `Cmd + Z`** | Undo |
| **`Ctrl + Y` / `Cmd + Shift + Z`** | Redo |
| **`Escape`** | Close open flyouts / Exit Fullscreen |
| **`Delete` / `Backspace`** | Delete selected object |

### Troubleshooting Quick Guide
1. **Hands-Free Microphone Unresponsive?**  
   Ensure browser microphone permissions are set to `Allow`. On Chrome, verify the padlock icon in the URL bar.
2. **Running in Complete Offline Mode?**  
   Open **Settings**, navigate to the **AI** tab, and toggle your preference to **Ollama (Local)**. Ensure Ollama is running on your machine.
3. **Screen Touch Rejection (Palm Rejection)?**  
   Tap the viewport lock icon in the bottom dock to prevent accidental canvas shifting while resting your hand on the whiteboard.

---
*Official TRIDO Smartboard Documentation (2026 Revision).*
