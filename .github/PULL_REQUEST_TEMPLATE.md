## Summary
<!-- Describe what this PR changes and why. -->

## Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] Security fix (XSS, SSRF, sandbox, input validation)
- [ ] New feature / classroom tool (non-breaking change that adds functionality)
- [ ] Accessibility / Hands-Free Voice improvement (Pak Damar standard)
- [ ] Documentation / CI workflow update

## Quality & Verification Checklist
- [ ] `npm run check` (`tsc --noEmit`) passes with **0 errors**
- [ ] `npx vitest run` passes **100% of unit & integration tests**
- [ ] `npm run build` succeeds cleanly
- [ ] Offline-first compatibility verified (works with local Ollama / manual fallback)
- [ ] UI adheres to Trido tactile minimalism standards (warm paper `#e4e3e0`, Trido Blue `#1550aa`, Dark Ink `#0a1a3a`, Sun Yellow `#ffcc00`, zero gradients, 120 FPS drag/resize with `transition: none`)
- [ ] Multilingual support verified (`utils/translations.ts` keys added for `id` and `en`)

## Screenshots / Test Output
<!-- Paste terminal test output or UI screenshots if applicable. -->
