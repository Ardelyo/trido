# Contributing to Trido

Thanks for wanting to contribute. Trido is a project that exists for a specific reason — to make teaching tools that actually work for educators with disabilities. Keep that in mind when proposing or reviewing changes.

## Before You Start

Read the [README](./README.md) and try running it locally. Understanding the voice → AI → canvas pipeline is essential before changing anything in it.

Run `npm run lint` before and after your changes. It should exit 0 both times.

## What We Welcome

- Bug fixes (especially accessibility-related)
- New teaching widget types (mind maps, quiz variants, etc.)
- Better voice recognition handling
- Performance improvements on lower-end hardware
- Improved offline/Ollama experience
- Translations (the UI currently mixes Bahasa Indonesia and English)
- Documentation improvements

## What We Don't Need Right Now

- Rewrites or refactors of working systems
- Adding authentication/login systems
- Replacing Fabric.js (it's the right tool for this job)
- Adding analytics or tracking of any kind

## How to Contribute

1. **Fork** the repo and create a branch: `git checkout -b fix/what-you-fixed`
2. **Make your changes** — keep diffs small and focused
3. **Run the type check:** `npm run lint` — must pass with 0 errors
4. **Test it manually** — open the app, use voice, verify your change works
5. **Open a Pull Request** with a clear description of what changed and why

## Code Style

Match the existing code. The codebase uses:
- TypeScript (strict mode, `tsc --noEmit` is the gate)
- React hooks for state (Zustand + `useStore`)
- Fabric.js for canvas operations
- No test files yet (honest) — manual testing is the current standard

## Reporting Bugs

Use the GitHub issue template. Include:
- Browser + OS
- AI mode (Gemini / Ollama / Auto)
- What you said / typed
- What happened vs what you expected
- Console errors if any (F12 → Console)

## A Note on Scope

This project started because of one specific teacher in Bandung with physical disabilities. If your contribution makes things easier for someone like him — or anyone who finds standard tools inaccessible — it will be reviewed with enthusiasm.

If it doesn't connect to that purpose in any meaningful way, it might still be merged, but it won't be prioritized.
