# Trido AI Architecture & Agent Runbook

## Core Architecture Map
- Constants & Defaults: `constants.ts` (Gemini: `gemini-3.8-flash`, Ollama: `gemma4:e2b`, Vertex: `gemini-3.8-flash` in `gemma4good-494311`)
- Global State: `store.ts` (Zustand: active tools, pages, session history, chat messages, whiteboard canvas state)
- AI Adapters & Routing:
  - Vertex AI: `server/vertexAdapter.ts`
  - Google AI Studio: `server/geminiAdapter.ts`
  - Ollama: `server/ollamaAdapter.ts`
  - Tool Routing & Execution: `server/aiTools.ts`
  - Express API Router: `server/aiRouter.ts`
  - Vercel Serverless: `api/ai/*.ts` (generate, status, transcribe, tool-content, pull-model)
- UI Badges & Status:
  - Header Model Badge: `components/AiStatusBadge.tsx`
  - AI State Strings & Polling: `hooks/useAiStatus.ts`
  - Settings Modal: `components/SettingsView.tsx`
  - Chat Drawer: `components/ChatMessageItem.tsx` and `App.tsx`
  - Canvas Manager: `components/CanvasManager.tsx`
  - Export/Import Dialog: `components/ExportDialog.tsx`

## Strict Agent Rules (Zero-Thrashing Protocol)
1. Fast Typecheck: DO NOT run `npm run build` or full linter repeatedly during iteration. Run `npm run check` (`tsc --noEmit`) which completes in < 3 seconds.
2. Single-Pass Whole-File Reads: For files under 400-500 lines, read the entire file in one call. Never read files in disjointed 30-80 line micro-slices.
3. Batched Multi-Hunk Patches: Combine all edits for a single file into one patch call instead of multiple successive single-line patches.
4. Scoped Search First: Before editing or when investigating strings/badges, run a single scoped grep across target directories (`server/`, `api/`, `components/`, `hooks/`). Do not perform repeated blind global greps.
5. No Live Network Smoke Scripts: Do not write ad-hoc network test scripts that hit live Vertex or Gemini endpoints to verify compile-time renames. Trust `tsc --noEmit` and unit assertions.
6. Targeted Redirection: When redirected or debugging UI text, inspect `hooks/useAiStatus.ts` and `components/AiStatusBadge.tsx` first instead of broad global scans.
