# Contributing to Smartboard Teach AI

Thanks for considering contributing. This document outlines how to get involved.

## Code of Conduct

Be respectful. We're building a tool for educators; let's keep it constructive and kind.

## Development Setup

### 1. Clone and Install

```bash
git clone <repo>
cd smartboard-teach-ai
npm install
```

### 2. Set Up Environment

```bash
cp .env.example .env.local
# Add your VITE_GEMINI_API_KEY or run with Ollama only
```

### 3. Start Dev Server

```bash
npm run dev
```

Both frontend (5173) and backend (3000) start automatically.

### 4. Type Check Frequently

```bash
npm run lint
```

No TypeScript errors before committing. This is a hard requirement.

## What to Work On

### High Priority (Most Useful)

- [ ] Unit tests for canvas operations (store mutations, object interactions)
- [ ] Ollama model management UI (show models, switch, download progress)
- [ ] Documentation improvements (clarify existing docs, add examples)
- [ ] Accessibility enhancements (keyboard shortcuts, screen reader support)

### Medium Priority

- [ ] Additional quiz types (drag-and-drop matching, ordering questions)
- [ ] Image import/export functionality
- [ ] Undo/redo stack optimization (currently basic)
- [ ] Performance profiling and optimization

### Lower Priority (Nice to Have)

- [ ] Dark theme
- [ ] Collaborative drawing (multiple teachers on same board simultaneously)
- [ ] Plugin system for custom tools
- [ ] Mobile app (React Native)

## Making Changes

### Branch Naming

```bash
git checkout -b feature/add-image-import
git checkout -b fix/canvas-memory-leak
git checkout -b docs/improve-readme
```

### Commit Messages

Be clear about what changed and why:

```
✓ Good:
  feat: Add image upload to canvas
  - Allow teachers to import PNG/JPG
  - Auto-scale to fit canvas
  - Store in IndexedDB

✗ Bad:
  fixed stuff
  update
  asdf
```

### Code Style

- Use TypeScript (no `any` types unless absolutely necessary)
- Use Tailwind CSS for styling (avoid inline CSS)
- Add comments for complex logic
- Keep functions small and focused
- Name variables clearly

**Example:**
```typescript
// Good: Clear, typed, purposeful
function createMindMapNode(text: string, position: Point): FabricObject {
  const node = new fabric.Circle({
    radius: 40,
    left: position.x,
    top: position.y,
    fill: '#e3f2fd'
  });
  
  const label = new fabric.Text(text, {
    left: position.x,
    top: position.y,
    fontSize: 14
  });
  
  return node;
}

// Avoid: Unclear, no types, magic numbers
function mkNode(t: any, p: any) {
  const n = new fabric.Circle({ radius: 40, left: p.x, top: p.y });
  return n;
}
```

### File Organization

- **Components**: One component per file in `components/`
- **Hooks**: Custom React hooks in `hooks/`
- **Server routes**: API handlers in `server/`
- **Tests**: Co-located with source (e.g., `CanvasManager.test.tsx` next to `CanvasManager.tsx`)
- **Utils**: Helper functions in `utils/`

## Testing Locally

### Manual Testing Checklist

Before submitting a PR, test:

- [ ] Type check passes: `npm run lint`
- [ ] Dev server starts: `npm run dev`
- [ ] Build succeeds: `npm run build`
- [ ] Feature works as intended
- [ ] No console errors/warnings introduced
- [ ] Existing features still work (no regressions)

### Writing Tests

If adding a feature, add tests. We use Jest and React Testing Library.

**Example test:**
```typescript
// CanvasManager.test.tsx
import { render, screen } from '@testing-library/react';
import CanvasManager from './CanvasManager';

describe('CanvasManager', () => {
  it('initializes canvas on mount', () => {
    render(<CanvasManager />);
    expect(screen.getByRole('canvas')).toBeInTheDocument();
  });

  it('adds object to canvas when instructed', () => {
    const { getByText } = render(<CanvasManager />);
    const addButton = getByText('Add Shape');
    
    fireEvent.click(addButton);
    expect(screen.getByText('Circle')).toBeInTheDocument();
  });
});
```

**Run tests:**
```bash
npm test
```

## Documentation

### Update Docs When Adding Features

If you add a new AI tool:
- Add function definition to `server/aiTools.ts`
- Document it in `docs/API_DOCUMENTATION.md`
- Add usage example in `docs/TEACHER_GUIDE.md`

If you change configuration:
- Update `constants.ts` comment
- Update `README.md` Configuration section

### Inline Code Comments

Comment the "why," not the "what":

```typescript
// Good: Explains intent
// We debounce socket sync to prevent overwhelming viewers with updates
const debouncedSync = debounce(() => socket.emit('canvas-update'), 300);

// Bad: States the obvious
// Debounce the sync function
const debouncedSync = debounce(() => socket.emit('canvas-update'), 300);
```

## Submitting a PR

### Before Opening

1. [ ] Code follows style guide
2. [ ] All tests pass (`npm test`)
3. [ ] Type check passes (`npm run lint`)
4. [ ] Documentation updated (if necessary)
5. [ ] No debugging code left in (console.logs, etc.)

### PR Description

```markdown
## What Changed
Brief description of the feature or fix.

## Why
Explain the problem this solves or value it adds.

## How to Test
Steps to verify the change works:
1. Start dev server
2. Say: "Create a mind map"
3. Verify nodes appear without errors

## Related Issues
Fixes #123
Relates to #456
```

### Review Process

- CI must pass (type check, lint, build)
- Reviewers may request changes
- Once approved, maintainers will merge

## Reporting Bugs

### Before Opening an Issue

Check if it's already reported: https://github.com/[repo]/issues

### Bug Report Template

```markdown
## Description
What happened that wasn't supposed to?

## Steps to Reproduce
1. Started dev server
2. Said: "Create a quiz"
3. Error appeared

## Expected Behavior
Quiz should appear on canvas

## Actual Behavior
Error: "Cannot read property 'text' of undefined"

## Environment
- OS: Windows 10
- Browser: Chrome 120
- Node: v18.12.0
- Ollama: Running / Not running

## Screenshots
[Attach if helpful]

## Logs
```
[Paste console error]
```
```

## Feature Requests

```markdown
## Problem
What problem does this solve?

## Solution
What feature would help?

## Example
How would a teacher use this?
```

## Running the Full Test Suite

```bash
# Type check
npm run lint

# Unit tests
npm test

# Build check
npm run build

# All together (use before PR)
npm run lint && npm test && npm run build
```

## Style Guide TL;DR

| What | Style |
|------|-------|
| Variables | camelCase |
| Components | PascalCase |
| Constants | UPPER_SNAKE_CASE |
| CSS Classes | lowercase-dash-case (Tailwind) |
| Files | PascalCase for React components, camelCase for utils |
| Async/Await | Prefer over `.then()` |
| Errors | Always provide context (don't just throw "Error") |

## Getting Help

- **Questions?** Open a Discussion (if available) or ask in an issue
- **Stuck?** Mention @[maintainer] in a PR with specific questions
- **Design decisions?** Discuss in issue before implementing

## Roadmap

High-level priorities for the project:

1. **Q1 2026**: Unit test coverage to 50%
2. **Q1 2026**: Ollama model management UI
3. **Q2 2026**: Image import/export
4. **Q2 2026**: Performance optimization for large canvases
5. **Q3 2026**: Collaborative features (multiple instructors)

Interested in any of these? Start a discussion!

## Tips for Success

1. **Start small:** Fix a typo or small bug first to get familiar with the codebase
2. **Communicate early:** If tackling something big, open an issue first to discuss approach
3. **Test thoroughly:** Don't assume changes only affect the code you touched
4. **Ask questions:** Better to ask than to waste time guessing
5. **Be patient:** Reviews take time; maintainers are probably busy

---

Thanks for contributing! 🎉

