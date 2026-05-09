# Smartboard Teach AI - Task & Checklist

**Project Status:** Active Development  
**Last Updated:** May 9, 2026  
**Team Lead:** Development Team

---

## Phase 1: Bug Fixes & Critical Issues

### Priority 1 - High (Must Fix)

- [ ] **Fix API_KEY environment variable**
  - [ ] Change `process.env.API_KEY` to `import.meta.env.VITE_API_KEY` in services
  - [ ] Update .env.example with VITE_GEMINI_API_KEY
  - [ ] Test API key loading in production build
  - Target: Prevent undefined API crashes

- [ ] **Fix inconsistent model names**
  - [ ] Audit all three model name locations
  - [ ] Unify to GEMINI_MODEL constant from constants.ts
  - [ ] Update geminiService.ts (generateToolContent & transcribeAudio)
  - Target: Single source of truth for model

- [ ] **Fix CALCULATOR component functionality**
  - [ ] Add event listeners to calculator buttons
  - [ ] Implement calculation logic (respecting operator precedence)
  - [ ] Wire up display element
  - [ ] Test all basic operations (+, -, *, /)
  - Target: Fully functional calculator in AI tools

- [ ] **Fix TIMER component functionality**
  - [ ] Add Start/Pause/Reset button handlers
  - [ ] Implement countdown logic
  - [ ] Add audio/visual alert when time ends
  - [ ] Test timing accuracy
  - Target: Working timer that can be used in class

- [ ] **Fix FLASHCARD CSS/3D transforms**
  - [ ] Replace custom perspective CSS with proper Tailwind or inline styles
  - [ ] Implement CSS 3D transforms with vendor prefixes or JavaScript
  - [ ] Test flip animation on Chrome, Firefox, Safari
  - Target: Smooth flashcard flip without browser crashes

### Priority 2 - Medium (Should Fix)

- [ ] **Fix useEffect dependency arrays**
  - [ ] Review useSocketSync.ts:22 ref dependencies
  - [ ] Fix useAgentProcessor.ts memory leak (interval recreation)
  - [ ] Ensure all refs/callbacks properly memoized
  - Target: Stable rendering, no console warnings

- [ ] **Fix setBrushWidth interface consistency**
  - [ ] Add setBrushWidth to store interface
  - [ ] Ensure all store mutations defined
  - Target: Full type safety in Zustand store

- [ ] **Fix server-side room state persistence**
  - [ ] Implement in-memory backup or local file storage for rooms
  - [ ] Add room recovery on server restart
  - [ ] Test viewer reconnection after restart
  - Target: Zero data loss on server crashes

---

## Phase 2: UX Improvements & Truth in Labeling

### Priority 1 - High (User-Facing)

- [ ] **Fix "Mode Luring" (Offline Mode) Label**
  - [ ] Implement true offline support with Ollama fallback
  - [ ] Only show "Mode Luring" badge when actually using local Ollama
  - [ ] Auto-detect network connectivity
  - [ ] Show "Mode Cloud" when using Gemini
  - Target: Honest mode indicators

- [ ] **Add clear API error messages**
  - [ ] Differentiate between: invalid key, no internet, rate limited, model not found
  - [ ] Show user-friendly error dialogs
  - [ ] Add retry mechanism with exponential backoff
  - Target: Users know exactly what went wrong

- [ ] **Fix voice input browser compatibility**
  - [ ] Check for Web Speech API support
  - [ ] Show warning/alternative for Firefox
  - [ ] Provide text input fallback
  - [ ] Test across Chrome, Firefox, Safari, Edge
  - Target: Voice works or degrades gracefully

- [ ] **Fix mobile responsive layout**
  - [ ] Audit z-index stacking on mobile
  - [ ] Ensure sidebar doesn't overlap canvas incorrectly
  - [ ] Test touch interactions
  - [ ] Verify responsive breakpoints (<1024px)
  - Target: Seamless mobile experience

### Priority 2 - Medium (Feature)

- [ ] **Add fallback tools when AI unavailable**
  - [ ] Enable basic drawing without AI
  - [ ] Allow manual text input
  - [ ] Keep timer/calculator available offline
  - Target: Partial functionality without AI

- [ ] **Improve network/API status UI**
  - [ ] Add status indicator (connected/connecting/disconnected)
  - [ ] Show API quota/usage info
  - [ ] Add connection history/logs
  - Target: Transparency in system state

---

## Phase 3: Ollama Integration & Offline Mode

### Priority 1 - High (Core Feature)

- [ ] **Set up Ollama server integration**
  - [ ] Create ollamaAdapter.ts (already exists, review implementation)
  - [ ] Add model auto-download (gemma4:e2b)
  - [ ] Implement local API endpoint (/ollama/generate)
  - [ ] Test basic text generation
  - Target: Working local AI alternative

- [ ] **Implement network detection & auto-switch**
  - [ ] Add online/offline detection (navigator.onLine + ping test)
  - [ ] Create switching logic between Gemini & Ollama
  - [ ] Fallback gracefully when both unavailable
  - [ ] Persist user preference
  - Target: Seamless mode switching

- [ ] **Test Ollama performance**
  - [ ] Measure response time for mind map generation
  - [ ] Test canvas rendering under load
  - [ ] Check memory usage with large sessions
  - [ ] Benchmark vs Gemini Cloud
  - Target: Acceptable UX on both local & cloud

### Priority 2 - Medium (Polish)

- [ ] **Add Ollama model management UI**
  - [ ] Show available models
  - [ ] Allow model switching
  - [ ] Display model size and download progress
  - Target: User control over local models

---

## Phase 4: Refactoring & Code Quality

### Priority 1 - High (Maintainability)

- [ ] **Centralize configuration**
  - [ ] Move all hard-coded values to constants.ts
  - [ ] Create config objects for Gemini, Ollama, UI thresholds
  - [ ] Environment variable documentation
  - Target: Single source for all config

- [ ] **Improve type safety**
  - [ ] Run `tsc --noEmit` and fix all type errors
  - [ ] Add missing @types packages
  - [ ] Review any `any` types and replace
  - Target: Zero TypeScript errors

- [ ] **Clean up socket.io communication**
  - [ ] Document all socket event types
  - [ ] Create strongly typed socket events
  - [ ] Add error handling for socket failures
  - Target: Robust real-time sync

### Priority 2 - Medium (Code Health)

- [ ] **Add logging system**
  - [ ] Implement structured logging (development vs production)
  - [ ] Add debug mode flag
  - [ ] Log AI actions for troubleshooting
  - Target: Better debugging capabilities

- [ ] **Unit tests for critical functions**
  - [ ] Test canvas state mutations
  - [ ] Test AI tool execution
  - [ ] Test socket room synchronization
  - Target: Regression prevention

---

## Phase 5: Documentation & Deployment

### Priority 1 - High

- [ ] **Complete README.md**
  - [ ] Installation instructions
  - [ ] Environment setup
  - [ ] Running locally (dev & production)
  - [ ] Docker/deployment instructions
  - [ ] Troubleshooting guide
  - Target: Clear onboarding

- [ ] **Create API documentation**
  - [ ] Document socket.io events
  - [ ] Document AI tool schemas
  - [ ] Document REST endpoints
  - [ ] Add usage examples
  - Target: Easy integration

### Priority 2 - Medium

- [ ] **Create deployment guide**
  - [ ] Prepare Dockerfile
  - [ ] Document cloud deployment steps
  - [ ] Add CI/CD pipeline (GitHub Actions)
  - [ ] Create monitoring setup guide
  - Target: One-click deployment

- [ ] **Create user guide for teachers**
  - [ ] Feature overview
  - [ ] Voice command examples
  - [ ] Tips for accessibility
  - [ ] Troubleshooting for educators
  - Target: Accessible documentation

---

## Summary Table

| Phase | Status | Critical Tasks | Due |
|-------|--------|-----------------|-----|
| 1: Bug Fixes | IN PROGRESS | 5 high priority bugs | Week 1-2 |
| 2: UX | PENDING | Fix labels, errors, mobile | Week 2-3 |
| 3: Ollama Integration | PENDING | Network detection, model switch | Week 3-4 |
| 4: Refactoring | PENDING | Config centralization, types | Week 4-5 |
| 5: Documentation | PENDING | README, API docs | Week 5-6 |

---

## Definition of Done

A task is considered complete when:
- [ ] Code changes pass `tsc --noEmit` without errors
- [ ] All existing features continue to work (no regressions)
- [ ] New code includes inline comments where complex
- [ ] Related documentation is updated
- [ ] Feature tested in development environment
- [ ] Browser console has no new warnings

---

## Quick Reference

**Critical Files to Watch:**
- services/aiService.ts (Gemini/Ollama switching)
- hooks/useGeminiBrain.ts (AI processing)
- components/CanvasManager.tsx (Canvas state)
- server.ts (Socket.io & API routes)
- store.ts (Global state)

**Development Commands:**
- `npm run dev` - Start dev server
- `npm run build` - Production build
- `npm run lint` - Type check
- `npm run preview` - Test production build locally

**Key Endpoints:**
- `http://localhost:5173` - Frontend (dev)
- `http://localhost:3000` - Backend server
- `http://localhost:11434` - Ollama API (if running)

**Environment Variables (in .env.local):**
- `VITE_GEMINI_API_KEY` - Google Gemini API key (required for cloud mode)
- `OLLAMA_URL` - Ollama server URL (optional, default: http://localhost:11434)
