# Trido — API & Real-Time Protocol Reference

This document specifies all HTTP REST endpoints (`/api/ai/*`, `/api/health`), Socket.IO real-time synchronization events, and AI Function Calling tool schemas used in **Trido v1.1.0**.

---

## 1. HTTP REST API Endpoints

### `GET /api/health`
Health check endpoint used by the desktop Electron launcher (`electron/main.ts`), CI/CD pipelines, and cloud load balancers.

**Response (`200 OK`):**
```json
{
  "status": "ok",
  "version": "1.0.0",
  "uptime": 142.5,
  "timestamp": "2026-10-15T08:00:00.000Z"
}
```

---

### `GET /api/ai/status`
Returns real-time availability of Gemini Cloud, Local Ollama (including installed models), Vertex AI, and offline Faster-Whisper STT. Results are cached for 5 seconds unless `?refresh=true` is passed.

**Query Parameters:**
- `ollamaBaseUrl` *(optional)* — Validated via `sanitizeOllamaUrl` (loopback only).
- `refresh` *(optional)* — Set to `"true"` to bypass the 5s status cache.

**Response (`200 OK`):**
```json
{
  "gemini": true,
  "vertex": true,
  "vertexProject": "gemma4good-494311",
  "ollama": true,
  "ollamaModels": ["trido-model:latest", "trido-gemma:2b", "gemma4:e2b"],
  "whisper": true,
  "defaultProvider": "gemini"
}
```

---

### `POST /api/ai/generate`
Executes System 2 agentic reasoning and returns structured tool calls (`functionCalls`) plus a natural-language conversational response (`text`).

**Request Body:**
```json
{
  "prompt": "Buatkan peta konsep tentang sistem peredaran darah manusia",
  "provider": "ollama",
  "ollamaModel": "trido-model:latest",
  "geminiModel": "gemini-3.8-flash",
  "language": "id",
  "canvasObjects": [],
  "domElements": [],
  "viewportBounds": { "left": 0, "top": 0, "right": 1920, "bottom": 1080, "zoom": 1 }
}
```

**Response (`200 OK`):**
```json
{
  "text": "Berikut peta konsep sistem peredaran darah manusia.",
  "functionCalls": [
    {
      "name": "render_mermaid",
      "args": {
        "title": "Sistem Peredaran Darah Manusia",
        "code": "mindmap\n  root((Sistem Peredaran Darah))\n    Jantung\n      Serambi Kanan dan Kiri\n      Bilik Kanan dan Kiri\n    Pembuluh Darah\n      Arteri - Pembuluh Nadi\n      Vena - Pembuluh Balik",
        "gridPosition": "CENTER"
      }
    }
  ],
  "provider": "ollama",
  "model": "trido-model:latest"
}
```

---

### `POST /api/ai/transcribe`
Transcribes base64-encoded classroom audio (`audio/webm` or `audio/wav`) into text using offline **Faster-Whisper** (`whisper`), **Gemini Audio**, or **Vertex AI**.

**Request Body:**
```json
{
  "audio": "<base64-audio>",
  "mimeType": "audio/webm",
  "provider": "whisper",
  "whisperModel": "base"
}
```

**Response (`200 OK`):**
```json
{
  "text": "Buat timer sepuluh menit",
  "provider": "whisper"
}
```

---

### `POST /api/ai/tool-content`
Generates structured JSON content for specific interactive widgets (e.g., AI Quiz Generator inside `QuizTool.tsx` or Flashcards).

---

### `POST /api/ai/pull-model`
Streams Server-Sent Events (`text/event-stream`) progress while downloading and calibrating a local Ollama model (`trido-model:latest`, `trido-gemma:2b`, `gemma4:e2b`).

---

## 2. Socket.IO Real-Time Synchronization Events

Defined in `server.ts` and `hooks/useSocketSync.ts`:

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `join-room` | Client → Server | `roomId: string` (`<= 128` chars) | Joins a classroom session and triggers `canvas-init`, `dom-elements-init`, and `viewport-update`. |
| `canvas-init` | Server → Client | `CanvasJson` | Full initial Fabric.js canvas state sent to newly joined viewers. |
| `canvas-update` | Bidirectional | `{ roomId, data }` | Full Fabric.js canvas snapshot update (persisted to `rooms.json`). |
| `canvas-delta` | Bidirectional | `{ roomId, action: 'add' \| 'modify' \| 'remove', objectId, objectData }` | High-frequency incremental object delta for 120 FPS collaborative drawing. |
| `dom-elements-init` | Server → Client | `Record<string, DomElementState>` | Initial interactive widget overlays (Mermaid, Quiz, Timer, etc.). |
| `dom-elements-update` | Bidirectional | `{ roomId, elements }` | Synchronizes DOM widget creation, in-place mutation, and coordinates across viewers. |
| `viewport-update` | Bidirectional | `{ roomId, viewport: number[] }` | Synchronizes camera pan/zoom matrix (`[scaleX, 0, 0, scaleY, panX, panY]`). |
| `agent-state-update` | Bidirectional | `{ roomId, state }` | Synchronizes AI agent cursor coordinates and status HUD. |

---

## 3. Core AI Function Calling Declarations (`server/aiTools.ts`)

| Tool Name | Purpose | Key Parameters |
|-----------|---------|----------------|
| `render_mermaid` | Renders an interactive Mermaid `mindmap` or `flowchart` SVG widget (sanitized via 5-Layer `sanitizeMermaidCode`). | `title`, `code`, `gridPosition` |
| `add_component` | Spawns an interactive classroom widget (`TIMER`, `QUIZ`, `CALCULATOR`, `NOTES`, `PERIODIC_TABLE`, `UNIT_CONVERTER`, `ATTENDANCE`, `SPIN_WHEEL`, `SCOREBOARD`, `MATH_GRAPH`). | `componentType`, `configJson`, `gridPosition` |
| `update_component` | **In-place mutation** of an existing DOM widget (`MERMAID_DIAGRAM`, `MARKMAP`, `TIMER`, `NOTES`, `ATTENDANCE`, `SCOREBOARD`) by `targetId`. | `targetId`, `configJson` |
| `render_custom_app` | Renders a sandboxed HTML/CSS/JS interactive simulation inside `AppBuilderTool.tsx`. | `title`, `html`, `css`, `js`, `gridPosition` |
| `control_viewport` | Navigates camera (`ZOOM_IN`, `ZOOM_OUT`, `RESET`, `PAN_TO` specific object or coordinates). | `action`, `x`, `y`, `zoomLevel` |
| `create_shape` / `add_text_label` / `connect_nodes` | Creates native Fabric.js vector shapes, typography labels, and connectors on the canvas. | `shapeType`, `text`, `gridPosition` |
| `modify_object` / `delete_object` / `clear_canvas` | Mutates or removes existing canvas/DOM objects by `targetId`. | `targetId`, `action` |
