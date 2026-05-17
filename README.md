# Trido — AI-Powered Smartboard for Teachers Who Deserve Better Tools

> *"Technology is abundant. But the people who actually care about inclusion — those are rare."*

---

Trido is a voice-controlled, AI-powered digital whiteboard built specifically for educators. Not for enterprises, not for product demos, not for a pitch deck. For teachers. Especially teachers who most tools forget exist.

The name comes from **Tri** (three pillars: Teacher, Student, Technology) and **Do** (just do it — make it work, make it matter).

## The Story Behind This

This project didn't start from a business case. It started from watching a real person struggle.

**Pak Damar** (Dadan Mochammad Ramdhan) is a Bahasa Indonesia teacher in Bandung, Indonesia. He teaches with passion, patience, and depth. He also lives with physical disabilities affecting both his hands and legs. Every day, he stands in front of a class and finds ways to make learning stick — with voice, with wit, with whatever digital tools cooperate that day.

Most tools don't cooperate. They're built for someone who can drag, click, hold, resize, type, and scroll — all at the same time. Pak Damar shouldn't have to work around that. He should just be able to teach.

So we built Trido. He tested it. He used it for real classes. And he told us what actually mattered versus what we thought mattered. That feedback loop is what made Trido real rather than just another AI demo.

This is not just about technology. Plenty of people build technology. This is about *who* you build for — and being honest about it.

---

## What Trido Actually Does

You talk. The AI listens. The board builds itself.

Ask Trido to make a mind map — it draws one, node by node, with the animated cursor showing every move. Ask for a quiz — it generates multiple-choice questions, drag-and-match exercises, or essay prompts on the fly. Ask it to start a timer, pull up the periodic table, or summarize what's on the board — it does that too.

Students connect through any browser and watch the board update live. No app to install, no account to create.

**The core loop:**
1. Teacher speaks (or types)
2. Gemma 4 processes the request and decides what tools to use
3. An animated agent cursor moves across the canvas, placing objects
4. Everything syncs to connected viewers via WebSocket in real time

It works when you're offline. It works with a slow connection. It works with a $200 laptop in a classroom where the projector is the only screen that matters.

---

## Features That Actually Get Used

- **Voice control, end-to-end** — dual path: Web Speech API for real-time preview + MediaRecorder + Gemini transcription as fallback for accuracy
- **Infinite whiteboard** — scroll, zoom, multi-page, undo/redo — all the things a real whiteboard needs
- **AI-generated teaching widgets** — mind maps, quizzes (4 types), document summaries with math rendering, flashcards, timers, calculators
- **Interactive apps on canvas** — the AI can write complete HTML/CSS/JS apps and render them inside the board
- **Live student collaboration** — share a room URL; students see everything you do
- **Offline mode** — plug in Ollama locally with `gemma4:e2b`, disconnect from the internet, keep teaching
- **Session memory** — auto-saves to IndexedDB, so yesterday's lesson is still there tomorrow
- **Print any widget** — every component has a print button that opens a clean PDF-ready view

---

## Setup

### You'll Need

- Node.js 18 or newer
- A Google Gemini API key from [aistudio.google.com](https://aistudio.google.com/apikey) (free tier is fine)
- *Optional:* [Ollama](https://ollama.ai) if you want offline mode

### Install

```bash
git clone https://github.com/Ardelyo/smartboard-teach-ai
cd smartboard-teach-ai
npm install
cp .env.example .env
```

### Configure `.env`

```env
# AI mode: 'gemini' (cloud) or 'ollama' (local)
AI_MODE=gemini

# Gemini — model via @google/genai SDK
GEMINI_API_KEY=your_key_here

# Ollama — for offline use
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=gemma4:e2b
```

### Run

```bash
npm run dev
```

Open `http://localhost:3000` — that's both the backend and the frontend. One server, one port.

### First voice command to try

> *"Buat mind map tentang fotosintesis"*
> *(or "Create a mind map about photosynthesis")*

The board should animate and build it out. If that works, everything works.

---

## Using Ollama Offline

This is the setup Pak Damar actually uses when classroom internet is unreliable:

```bash
# Pull the model once (about 2.5GB)
ollama pull gemma4:e2b

# Start Ollama
ollama serve
```

Set `AI_MODE=ollama` in your `.env` and the app switches automatically. No internet required after that initial download.

---

## Project Structure

```
smartboard-teach-ai/
├── App.tsx                    # Root component + routing
├── store.ts                   # Zustand global state
├── types.ts                   # TypeScript interfaces
├── constants.ts               # All config (models, timeouts, ports)
├── server.ts                  # Express + Socket.IO entry point
│
├── components/
│   ├── CanvasManager.tsx      # Fabric.js canvas + all drawing logic
│   ├── ChatInterface.tsx      # Voice input, text input, toolbar
│   ├── DomOverlay.tsx         # Widget rendering on top of canvas
│   ├── AgentCursor.tsx        # Animated AI cursor
│   ├── DocumentBlock.tsx      # Markdown + KaTeX rendering
│   ├── AppBuilderTool.tsx     # Custom HTML/CSS/JS app host
│   ├── TimerTool.tsx          # Timer/stopwatch/alarm widget
│   └── quiz/                  # Quiz component variants (4 types)
│
├── hooks/
│   ├── useGeminiBrain.ts      # AI request → action queue mapping
│   ├── useAgentProcessor.ts   # Executes actions on canvas with animation
│   ├── useAiStatus.ts         # Polls /api/ai/status every 5s
│   └── useSocketSync.ts       # Real-time collaboration sync
│
├── server/
│   ├── aiRouter.ts            # /api/ai/* routes + AI mode selection
│   ├── geminiAdapter.ts       # @google/genai SDK calls
│   ├── ollamaAdapter.ts       # Ollama REST API calls
│   ├── vertexAdapter.ts       # Vertex AI SDK (optional)
│   └── aiTools.ts             # Function declarations + system prompt
│
└── services/
    ├── aiService.ts           # Frontend → backend fetch wrapper
    └── db.ts                  # IndexedDB session persistence
```

---

## How the AI Bit Works

The AI uses **function calling** (not free-form text parsing). The model receives the teacher's request + a screenshot of the current canvas + a list of existing objects, and responds by calling one or more defined functions.

Functions include things like:
- `add_mindmap_node(text, relativePosition, style)`
- `add_component(componentType, gridPosition, configJson)`
- `connect_nodes(fromNodeText, toNodeText, lineStyle)`
- `pan_camera(targetObjectId, direction)`
- `add_interactive_app(title, html, css, js, gridPosition)`

These get converted into an action queue. The `useAgentProcessor` hook processes them one at a time, animating the cursor to each target position along a Bezier curve before executing each action. It looks like someone is actually doing the work, because — in a sense — something is.

The system prompt is built fresh each request and includes the current canvas state, page number, and existing DOM widgets. The model knows what's already on the board.

---

## Supported Commands (Examples)

```
"Buat soal pilihan ganda tentang hukum Newton"
→ Creates an interactive multiple-choice quiz widget

"Rangkum materi ini dalam bentuk dokumen"
→ Generates a structured Markdown document with formulas

"Start a 15-minute timer"
→ Places a countdown timer widget on the board

"Buat mind map: Pancasila → Sila 1, Sila 2, Sila 3"
→ Draws a mind map with connecting arrows

"Buatkan soal cocokkan pasangan tentang ibu kota negara"
→ Creates a drag-and-match quiz with shuffled pairs

"Geser ke bawah"
→ Pans the camera downward
```

The AI understands both Bahasa Indonesia and English, switches between them naturally, and doesn't need exact phrasing. It's a language model — it infers intent.

---

## Development

```bash
npm run dev      # Start everything (server + Vite HMR)
npm run build    # Production build to dist/
npm run lint     # TypeScript check (must pass — tsc --noEmit)
npm start        # Production server only (after build)
```

TypeScript is strict. Run `npm run lint` before committing. It should exit 0.

---

## Environment Variables Reference

| Variable | Default | Purpose |
|----------|---------|---------|
| `AI_MODE` | `gemini` | `gemini`, `ollama`, `vertex`, or `auto` |
| `GEMINI_API_KEY` | — | Google AI Studio key for Gemma 4 cloud |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Local Ollama server |
| `OLLAMA_MODEL` | `gemma4:e2b` | Ollama model tag |
| `SERVER_PORT` | `3000` | HTTP server port |

---

## Browser Support

| Browser | Voice Input | Canvas | Notes |
|---------|-------------|--------|-------|
| Chrome 90+ | ✅ Full | ✅ | Recommended |
| Edge 90+ | ✅ Full | ✅ | Works great |
| Firefox 88+ | ⚠️ Fallback | ✅ | Uses recorded audio + transcription |
| Safari 14+ | ⚠️ Partial | ✅ | Needs user gesture first |

Tablet-tested: iPad (Safari) and Android Chrome. The layout adapts below 1024px.

---

## What Makes This Different From Just Another AI Demo

Most AI demos show a polished interface doing something impressive in a controlled setting. That's fine — but it's not this.

Trido has been used by a real teacher in real classes. The rough edges that got smoothed out were the ones Pak Damar actually hit. The features that got added were the ones he actually needed. When he said "saya susah klik tombol kecil itu" (I struggle to click small buttons), we made the targets bigger. When the voice recognition missed him because the classroom was noisy, we added the MediaRecorder fallback to Gemini transcription.

The technology — Gemma 4, function calling, Fabric.js, Socket.IO — is the scaffold. The building is a classroom where a teacher with disabilities can show up fully, without having to ask for help doing what he does best.

---

## License

MIT. Use it, fork it, build on it. If you build something for educators, tell us about it.

---

*Built in Indonesia. Tested in a real classroom in Bandung.*
*For Pak Damar, and every teacher like him.*
