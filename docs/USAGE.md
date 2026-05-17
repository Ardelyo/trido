# Trido — Usage Guide

This guide is written for teachers, not developers. If you're technical and want to understand the architecture, check the README instead. This one is for the people who'll actually be standing in front of a classroom using this.

---

## Getting Started

When you open Trido for the first time, you'll see an empty white canvas with a toolbar on the left and a microphone button at the bottom. That's it. There's no tutorial that pops up, no wizard, no onboarding flow. The idea is: just talk to it.

**The single most important thing to know:** Trido understands natural language in both Bahasa Indonesia and English. You don't need to memorize commands. Just say what you want, like you'd explain it to a colleague.

---

## Giving Commands

### By Voice

Click the blue microphone button at the bottom of the screen. A red pulse appears when it's listening. Talk normally. Click again when you're done, and Trido processes what you said.

You'll see an animated cursor start moving across the canvas — that's the AI working. It moves from place to place and creates things. Give it a few seconds.

If you're in a noisy classroom, the voice recognition might pick up background sound. Trido has two layers: the browser's built-in speech recognition (instant preview) and an AI transcription backup that kicks in if the browser misses you. Both run automatically.

### By Text

Click the chat icon (or press the arrow icon in the bottom toolbar) to open the text input panel. Type your request there. Same results, no microphone needed.

---

## What You Can Ask For

### Mind Maps

> *"Buat mind map tentang sistem peredaran darah"*
> *"Make a mind map: Climate Change → Causes, Effects, Solutions"*

Trido draws connected boxes with arrows. If you want to keep going after the first one:

> *"Tambahkan cabang: Solusi Individu dan Solusi Pemerintah"*

### Quizzes (4 types)

**Multiple choice:**
> *"Buat soal pilihan ganda tentang hukum Newton"*

**True or false:**
> *"Buat soal benar/salah tentang fotosintesis"*

**Essay questions:**
> *"Buat pertanyaan essay tentang perang kemerdekaan Indonesia"*

**Drag and match:**
> *"Buat soal cocokkan pasangan: ibu kota dan negara"*

Each quiz appears as an interactive widget students can actually answer. There's a check button that shows correct/incorrect in green and red.

### Documents and Summaries

> *"Buat rangkuman materi hukum newton dalam bentuk dokumen"*
> *"Summarize what's on the board into a document"*

This creates a formatted document widget with Markdown rendering. It supports math formulas — so if you ask for a physics summary, it'll include actual equations like F = ma displayed properly.

### Timers

> *"Start a 15-minute countdown timer"*
> *"Buat timer 10 menit"*
> *"Open a stopwatch"*

The timer widget appears on the board so students can see how much time is left for an activity.

### Calculator

> *"Buka kalkulator"*
> *"Open a calculator"*

A functional calculator appears on the canvas. Students can interact with it.

### Interactive Apps

This is the advanced one. Trido can generate fully working mini web applications and embed them directly in the canvas:

> *"Buat simulasi gelombang sinus interaktif"*
> *"Make an interactive periodic table with click-to-show details"*
> *"Build a simple quiz game about Indonesian provinces"*

These are real HTML/CSS/JavaScript apps written by Gemma 4 on the spot. They're sandboxed so they can't access anything outside the canvas. Quality depends on how complex the request is — simple tools work reliably, very complex simulations might need a follow-up tweak.

### Camera Navigation

> *"Geser ke bawah"* / *"Pan down"*
> *"Geser ke kiri"* / *"Pan left"*
> *"Pergi ke kuis yang tadi dibuat"*

The last one — asking it to go back to something you already made — works because Trido tells the AI what objects currently exist on the board, including their IDs. The AI can find the quiz widget and pan the camera there.

---

## The Toolbar (Left Side)

| Icon | What it Does |
|------|--------------|
| Arrow | Select and move objects |
| Pencil | Free draw mode |
| Circle | Draw a circle |
| T | Insert a text box |
| Image | Upload an image to the canvas |
| ⋯ | More tools (see below) |

**More tools** opens a panel with: Calculator, Timer, Quick Notes, AI Quiz Generator, Unit Converter, Periodic Table, Attendance Tracker, To-Do List, and Board Settings.

---

## Zoom and Navigation

- **Scroll** — zoom in/out
- **Right-click + drag** — pan the camera
- **Space + drag** — also pans
- **+/- keys** — zoom in/out with keyboard
- **0 key** — reset zoom to 100%

If you're on a touchscreen, pinch to zoom works too.

---

## Pages

Trido supports multiple pages in one session. The page navigator appears at the top of the screen. You can add a new page, switch between them, and each page saves independently.

Useful for: one page per lesson topic, or one page for student notes vs. one for teacher notes.

---

## Student Collaboration (Viewer Mode)

Share your board with students by clicking the share icon and copying the room URL. Students open that URL in any browser. They see:
- Everything on your canvas
- Live updates as you draw/speak
- Interactive widgets they can actually use (answer quizzes, etc.)

Students cannot modify the canvas — they're in view-only mode. The animated cursor they see is the AI agent working.

---

## Saving and Loading

Trido auto-saves every few seconds as you work. Sessions are stored locally in your browser.

To manually save with a name: click the save icon → "Save Session" → give it a name.

To load a previous session: click the history icon in the toolbar → pick a saved session.

Each session shows a thumbnail of the first page, which helps you identify them quickly.

---

## Printing a Widget

Every interactive component (documents, quizzes, diagrams) has a printer icon in its header bar. Clicking that opens a print-ready version in a new window, formatted cleanly for PDF export. Tailwind CSS and math rendering (KaTeX) are pre-loaded in the print window.

---

## Changing AI Provider

Go to: **More Tools (⋯) → Board Settings → AI Provider**

Options:
- **Automatic (Recommended)** — uses Gemini if key is available, falls back to Ollama
- **Google Gemini API** — cloud, faster for complex requests
- **Ollama (Local)** — offline, private, runs on your machine

If you're in an area without reliable internet, set this to Ollama and make sure you've downloaded the model beforehand (`ollama pull gemma4:e2b`).

---

## Tips From Actual Use

**For voice accuracy in noisy rooms:** Hold the microphone up slightly closer to your mouth than feels natural, and pause briefly before and after your command. Trido's transcription fallback is good but a cleaner signal helps.

**For complex mind maps:** Build them in stages. Ask for the main topic first, then ask to add branches. The AI tracks what's already on the board between requests.

**For quizzes:** After creating one, you can update it with the next question without making a new widget: *"Ganti soal di kuis itu dengan soal berikutnya tentang hukum kedua Newton"*

**For the "next question" flow:** This is designed for live teaching — you create one quiz widget and cycle through questions in the same window, rather than cluttering the board with multiple quiz boxes.

**Don't worry about exact phrasing.** The AI is a language model. If you say the same thing four different ways, it understands all four. The one thing that helps is being specific — "create a 5-question multiple choice quiz about the water cycle" is better than "make a quiz."

---

## Troubleshooting

**Voice button does nothing / no permission prompt:**
Your browser might have already blocked microphone access. Check the address bar for a camera/mic icon, click it, and allow access. Chrome settings: Settings → Privacy → Site Settings → Microphone.

**AI isn't responding / spinner runs forever:**
Check that your API key is set correctly in the `.env` file and the server is running. In Board Settings, you can see the current AI status (green = connected, red = not available).

**Canvas looks blank after loading:**
Sometimes IndexedDB state doesn't load on first render. Refresh the page once. If that doesn't help, check the History panel — your sessions are stored there.

**Widget won't close / keeps appearing:**
Each widget has an X button in its top-right corner. If the canvas is zoomed in and the X is off-screen, zoom out with scroll or the zoom controls.

**Ollama model not found:**
Run `ollama list` in your terminal. If `gemma4:e2b` isn't there, run `ollama pull gemma4:e2b`. Takes a few minutes the first time.

---

*If you're using Trido in your classroom and run into something that doesn't make sense, open an issue on GitHub. Real classroom feedback is what made this what it is.*
