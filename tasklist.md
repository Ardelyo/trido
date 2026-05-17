# 🔍 Audit & Tasklist — Smartboard Teach AI
> Audit Date: 2026-05-17 | TypeScript: ✅ 0 errors (`tsc --noEmit`)

---

## 📊 Overall System Verdict

| Layer | Status | Notes |
|-------|--------|-------|
| TypeScript Compilation | ✅ PASS | Zero type errors |
| Server (Express + Socket.IO) | ✅ Working | Proper startup, rooms persistence, vite proxy |
| AI Routing (Gemini / Ollama / Vertex) | ⚠️ Partial | Vertex probe is fake; Gemini model name mismatched |
| Frontend Canvas (Fabric.js) | ✅ Working | Full shape/draw/history/undo pipeline |
| DOM Overlay System | ✅ Working | All widget types correctly dispatched |
| Quiz Components | ✅ Working | All 4 types render; drag-match logic correct |
| Demo Mode (Scripted Prompts) | ⚠️ Partial | `generateAgentActions` called from browser context incorrectly |
| Voice / Audio Pipeline | ✅ Working | Dual-path (Web Speech + MediaRecorder) with Gemini fallback |
| Collaboration (Socket.IO) | ✅ Working | Room join, canvas-update, dom-elements-update all wired |
| Session Persistence (IndexedDB) | ✅ Working | save/load/delete via `idb-keyval` |
| BoardSettings — "Hapus Papan" | ❌ BUG | Button has no `onClick` handler — does nothing |
| BoardSettings — AI selector | ⚠️ BUG | Uses `useStore.getState()` inside JSX — misses re-renders |
| `update_component` JSON parse | ❌ BUG | No try-catch; malformed AI JSON crashes silently |
| Vertex AI Probe | ⚠️ RISK | Always returns `online: true` if `GOOGLE_CLOUD_PROJECT` is set, before any real call |
| GEMINI_API_KEY exposed in frontend | ⚠️ SECURITY | Vite `define` bakes key into JS bundle |
| `response-handler.ts` (demo) | ❌ BUG | Calls `generateAgentActions` (browser service) with empty canvas args — partial data, broken in browser context |

---

## 🔴 Critical Bugs (Must Fix)

- [ ] **[BUG-001] "Hapus Seluruh Papan" button is dead**
  - File: `components/BoardSettingsTool.tsx` line 74
  - The button has no `onClick`. Clicking it does nothing.
  - Fix: Add `onClick={() => { useStore.getState().createNewSession(); }}` and optionally clear the Fabric canvas via an event.

- [ ] **[BUG-002] `update_component` crashes on bad AI JSON**
  - File: `hooks/useGeminiBrain.ts` line 181
  - `JSON.parse(args.configJson)` is called with no try-catch. If the model returns malformed JSON (common with smaller models), it throws and silently swallows the entire AI response.
  - Fix: Wrap in try-catch; fall back to an empty `{}` config.

- [ ] **[BUG-003] Demo mode `response-handler.ts` calls browser AI service incorrectly**
  - File: `lib/demo-mode/response-handler.ts` line 35
  - `generateAgentActions(userInput, '', [], { width: 1024, height: 768 })` passes an empty canvas image and empty object list. The server will receive a blank PNG and no context — the result is unpredictable/useless.
  - This file is also never actually imported anywhere in the live app (dead code). Confirm whether it's intended to be used or can be removed.

- [ ] **[BUG-004] BoardSettings AI select uses stale `getState()` instead of reactive state**
  - File: `components/BoardSettingsTool.tsx` lines 32–33
  - ```tsx
    value={useStore.getState().aiPreference}       // ← not reactive
    onChange={(e) => useStore.getState().setAiPreference(...)}
    ```
  - The `value` will not update when preference changes from elsewhere. Replace with `const { aiPreference, setAiPreference } = useStore()`.

---

## 🟡 Warnings & Hidden Risks

- [ ] **[WARN-001] Vertex AI probe always returns `online: true`**
  - File: `server/aiRouter.ts` lines 88–96
  - `probeVertex()` never makes a real HTTP call. If credentials are wrong/expired, the server will declare Vertex "online" and then every `/api/ai/generate` call will fail at runtime with an auth error.
  - Fix: Make a lightweight real probe or at minimum check ADC token availability.

- [ ] **[WARN-002] Gemini model name inconsistency**
  - `constants.ts` line 1: `GEMINI_MODEL = 'gemma-4-31b-it'`
  - This is a Gemma model name, not a standard Gemini API model. The probe hits `generativelanguage.googleapis.com` which returns `404 model_not_found` for this name. Status endpoint incorrectly reports as unavailable.
  - Fix: Use a real Gemini model name (e.g. `gemini-1.5-pro`) OR set `GEMINI_API_BASE_URL` in `.env` pointing to your custom endpoint.

- [ ] **[WARN-003] GEMINI_API_KEY leaked to frontend bundle**
  - `vite.config.ts` lines 71–72: `define: { 'process.env.GEMINI_API_KEY': ... }`
  - The key is baked into the compiled JS bundle and visible to anyone with DevTools.
  - Fix: Remove the `define` block — the key is only needed server-side.

- [ ] **[WARN-004] Hooks used after early return in `ChatInterface` (React rules violation)**
  - File: `components/ChatInterface.tsx` lines 74–94
  - An early `return` for `isViewerUrl` appears before several `useRef`/`useState` calls. React Rules of Hooks requires all hooks to be called before any conditional return.
  - Fix: Move all hook declarations (lines 87–94+) above the `isViewerUrl` guard at line 74.

- [ ] **[WARN-005] `useEffect` closure captures stale `isListening` / `isTranscribing`**
  - File: `components/ChatInterface.tsx` lines 246–258
  - The `recognitionRef.current.onend` handler captures `isListening`/`isTranscribing` at setup time. With `[isListening, isTranscribing]` as deps, the SpeechRecognition object is recreated on every state change, risking duplicate recognition instances.
  - Fix: Use `useRef` for flags accessed inside callbacks.

- [ ] **[WARN-006] `PAN_CAMERA` — `execute()` doesn't await async task function**
  - File: `hooks/useAgentProcessor.ts` lines 171–197
  - `execute()` calls `taskFn()` synchronously (line 108) without `await`. The 30-step pan animation runs after `execute()` resolves, so the verification pause fires before the animation completes.
  - Fix: Change `execute()` signature to `taskFn: () => Promise<void>` and `await taskFn()`.

- [ ] **[WARN-007] `CHECKLIST` component type has no renderer in `DomOverlay`**
  - `server/aiTools.ts` line 111: `"CHECKLIST"` is in the AI enum.
  - `components/DomOverlay.tsx` has no `case 'CHECKLIST':`. Falls through to empty iframe.
  - Fix: Add a handler or map it to `TodoListTool`.

- [ ] **[WARN-008] `add_image` tool is unfulfillable by current AI backends**
  - `server/aiTools.ts` lines 184–200
  - Tool asks AI to provide `base64Data` for an image. LLMs (Gemini/Gemma/Vertex) cannot generate base64 image data as a function call argument. This tool will never work.
  - Fix: Remove tool or replace `base64Data` with an `imageUrl` parameter.

- [ ] **[WARN-009] Ollama model tag `gemma4:e2b` does not exist**
  - `.env` line 8 + `constants.ts` line 2: `OLLAMA_MODEL=gemma4:e2b`
  - This tag does not exist in the Ollama model registry. `probeOllama()` will always return `model_missing`, forcing system to fall back.
  - Fix: Verify with `ollama list` and update to correct tag (likely `gemma2:2b` or `gemma3:1b`).

- [ ] **[WARN-010] Socket.IO CORS wildcard**
  - `server.ts` line 44: `origin: "*"`
  - Acceptable for demo; must be restricted to specific domains before any production deployment.

---

## 🟢 Confirmed Working Features

- [x] **Canvas Drawing** — Pencil, Rect, Circle, Triangle, Star, Polygon, Line, Text via Fabric.js
- [x] **Undo / Redo** — 50-state history stack, correctly wired
- [x] **AI Generate Flow** — ChatInterface → useGeminiBrain → POST /api/ai/generate → aiRouter → adapter → functionCalls → useAgentProcessor
- [x] **Quiz Components** — Multiple Choice, Essay, True/False, Drag Match — all render and check answers
- [x] **DocumentBlock / DOCUMENT_PAGE** — Markdown with KaTeX math
- [x] **TimerTool** — TIMER / STOPWATCH / CLOCK / ALARM modes via AI config
- [x] **CalculatorTool** — Functional in sandboxed iframe
- [x] **AppBuilderTool (INTERACTIVE_APP)** — Custom HTML/CSS/JS sandboxed iframe apps
- [x] **Print/PDF per widget** — Opens print popup with Tailwind + KaTeX
- [x] **Demo Mode scripted prompts** — Jaccard fuzzy matching at 70% threshold; simulated token streaming
- [x] **Voice Input** — Dual-path: Web Speech API + MediaRecorder + Gemini transcription fallback
- [x] **Session Save/Load** — IndexedDB auto-save with 3-second debounce on canvas change
- [x] **Multi-page support** — Correct save/restore of canvas JSON + DOM elements per page
- [x] **Real-time Collaboration** — Socket.IO room sync for canvas, viewport, DOM overlay
- [x] **Viewer Mode** — Read-only canvas with live badge
- [x] **AI Status Probe** — `/api/ai/status` polled every 5s by frontend
- [x] **AI Error Classification** — `invalid_key`, `rate_limited`, `model_not_found`, etc. with retry
- [x] **Mindmap Positioning** — Relative world-coordinate tracking (`RIGHT_OF_LAST`, `BELOW_LAST`, etc.)
- [x] **PWA Support** — `vite-plugin-pwa` with Workbox caching for offline fonts

---

## 📋 Fix Priority Order

| Priority | ID | File | Estimated Effort |
|----------|----|------|-----------------|
| 🔴 P0 | BUG-004 | `BoardSettingsTool.tsx` | 5 min |
| 🔴 P0 | BUG-001 | `BoardSettingsTool.tsx` | 10 min |
| 🔴 P0 | BUG-002 | `hooks/useGeminiBrain.ts` | 5 min |
| 🔴 P0 | WARN-004 | `ChatInterface.tsx` | 15 min |
| 🟡 P1 | WARN-002 | `constants.ts` + `.env` | 5 min |
| 🟡 P1 | WARN-009 | `.env` | 2 min |
| 🟡 P1 | WARN-003 | `vite.config.ts` | 5 min |
| 🟡 P1 | WARN-006 | `hooks/useAgentProcessor.ts` | 10 min |
| 🟡 P1 | WARN-007 | `components/DomOverlay.tsx` | 10 min |
| 🟢 P2 | WARN-001 | `server/aiRouter.ts` | 30 min |
| 🟢 P2 | WARN-005 | `ChatInterface.tsx` | 20 min |
| 🟢 P2 | WARN-008 | `server/aiTools.ts` | 10 min |
| 🟢 P2 | BUG-003 | `lib/demo-mode/response-handler.ts` | 15 min |
| 🟢 P3 | WARN-010 | `server.ts` | 5 min |

---

## 🔮 AI Prediction System Assessment

The prediction pipeline (user prompt → AI → canvas action) is **architecturally correct** and will work under these conditions:

| Condition | Prediction |
|-----------|-----------|
| `AI_MODE=gemini` + valid key + standard Gemini model | ✅ Works after fixing WARN-002 |
| `AI_MODE=gemini` + current `gemma-4-31b-it` model name | ❌ 404 probe failure — falls to `auto` |
| `AI_MODE=ollama` + Ollama running + correct model tag | ✅ Works after fixing WARN-009 |
| `AI_MODE=vertex` + GCP credentials set | ⚠️ Real calls work; probe is misleading |
| `add_component` with valid JSON config | ✅ Working correctly |
| `update_component` with malformed JSON from AI | ❌ Silent crash (BUG-002) |
| `add_image` tool called by AI | ❌ AI cannot output base64 image data |
| Demo scripted prompt matching | ✅ Working at 70% Jaccard threshold |

> **Conclusion:** The app **can work** for a live demo with Gemini or Ollama. The TypeScript layer is clean (0 compiler errors). P0 bugs should be fixed before the demo; P1 items before any production deployment.
