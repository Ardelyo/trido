# Trido brand rules

Single source of truth: theme tokens in `index.css` and motion tokens in `design/motion.ts`.

| Role | Token | Value |
|---|---|---|
| Primary / actions / active | `trido` (`trido-deep` for pressed/dark) | `#1550aa` / `#0d3a80` |
| Text, headings, dark surfaces | `ink` | `#0a1a3a` |
| Highlight / focus ring / "new" | `sun` (`sun-soft`) | `#ffcc00` / `#ffd633` |
| Page background | `paper` | `#e4e3e0` |

- **Tints** use opacity of the brand colour (`bg-trido/5`, `border-trido/20`) — never `blue-*` or `indigo-*`.
- **Semantic colours** stay semantic: `emerald` success, `amber` warning, `rose`/`red` danger. Category colour-coding inside tool palettes (dock, periodic table, charts) is allowed.
- **Shape**: `rounded-sheet` (docks, drawers, dialogs), `rounded-2xl` cards, `rounded-full` pills/buttons. **Elevation**: `shadow-float`, `shadow-lift`.
- **Type**: headings use `font-display` (Inter Tight), UI/body Inter, code JetBrains Mono, long-form documents Merriweather.
- **Motion**: only presets from `design/motion.ts` (`spring.snappy|smooth|bouncy`, `tween.*`, `variants.*`); `MotionConfig reducedMotion="user"` is global.
- **Naming**: product is **Trido** (never "Trido++"); descriptor "AI Smartboard Classroom".
- **Defaults the AI draws with** (arrows, placeholders, mindmap root) use `#1550aa`.
