# Contributing to Trido

Thank you for contributing to **Trido — AI Smartboard for Inclusive Classroom Education**. Trido was created with **Pak Damar** (an Indonesian language teacher in Bandung living with physical disabilities) to ensure educators can run an entire interactive classroom using voice and continuous spatial AI.

---

## 1. Development Workflow & Prerequisites

- **Node.js:** v18+ (Node.js 22 LTS recommended)
- **Optional (Offline STT):** Python 3.10+ with `faster-whisper`
- **Optional (Offline LLM):** [Ollama](https://ollama.com) with `trido-model:latest` or `gemma4:e2b`

### Local Setup
```bash
git clone https://github.com/Ardelyo/trido.git
cd trido
npm install
cp .env.example .env
npm run dev
```
The unified Express + Socket.IO + Vite server starts at `http://localhost:3000` (`http://localhost:3000/?app=true` opens the Smartboard directly).

---

## 2. Mandatory Quality Gates (Before Opening a PR)

Every pull request is automatically checked by [`.github/workflows/ci.yml`](./.github/workflows/ci.yml). Run all three commands locally before pushing:

```bash
# 1. Strict TypeScript check (must exit 0 with 0 errors)
npm run check

# 2. Automated Unit & Integration Test Suite (17 suites / 126 tests via Vitest)
npx vitest run

# 3. Production Vite + PWA bundle verification
npm run build
```

---

## 3. Architectural & UI/UX Standards (Code Reviewer Checklist)

When writing or reviewing code in Trido, enforce these core standards:

1. **Tactile IKEA Minimalism & Brand Palette:**
   - Warm paper shell (`#e4e3e0`), Trido Blue (`#1550aa`), Dark Ink (`#0a1a3a`), Sun Yellow (`#ffcc00`), and crisp white (`#ffffff`).
   - **Strictly zero gradients** on logos, buttons, or widget headers.
   - Circular pill geometry (`rounded-full`) for triggers and uncluttered single-header widgets.
   - The right-hand AI drawer and its main trigger button are labeled **`Asisten`** (`t('assistant', 'Asisten')`).

2. **120 FPS Zero-Lag Canvas & DOM Interaction:**
   - Never apply `transition-all` to draggable or resizable canvas/DOM elements.
   - During `isDragging` or `isResizing`, force `transition: 'none'` and update coordinates via `requestAnimationFrame` with GPU-composited `translate3d(-50%, -50%, 0)`.

3. **Continuous State & In-Place Mutation (No Widget Dumping):**
   - Modifying an existing mindmap, diagram, timer, or attendance list must use `update_component` or `modify_object` in-place rather than recreating duplicate widgets.
   - All Mermaid code must pass through `sanitizeMermaidCode()` (`utils/mermaidSanitizer.ts`).

4. **Offline-First & Security:**
   - Core classroom tools must function 100% offline without requiring cloud AI.
   - Sanitize any raw HTML with `DOMPurify`, keep `<iframe srcDoc>` sandboxed without `allow-same-origin`, and validate custom Ollama URLs via `sanitizeOllamaUrl`.

5. **Multilingual Coverage (`utils/translations.ts`):**
   - Wrap user-facing UI strings in `t('key', 'Fallback')` and add entries to both `id` and `en` dictionaries in `utils/translations.ts`.

---

## 4. Branch Naming & Commit Conventions

- **Branches:**
  - `feat/<short-description>` (new features or classroom tools)
  - `fix/<short-description>` (bug or security fixes)
  - `docs/<short-description>` (documentation updates)
- **Commits:** Follow [Conventional Commits](https://www.conventionalcommits.org/):
  - `feat(quiz): add Moodle GIFT export for true/false questions`
  - `fix(mermaid): sanitize unescaped parentheses in mindmap child nodes`
  - `docs(readme): update architecture diagram and Windows .exe instructions`
