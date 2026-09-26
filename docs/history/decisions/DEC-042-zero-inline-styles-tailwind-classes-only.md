# DEC-042 — Zero Inline Styles — Tailwind Classes Only

## Source status

Historical decision recorded on 2026-06-26. The source provides an explicit decision statement. The source does not assign a separate lifecycle status to this record. Chronological presence does not prove current authority.

## Preserved decision record

**Date:** 2026-06-26

**Decision:** Styling exclusively through Tailwind classes. Zero `style={{}}` in JSX. Zero SCSS. Zero CSS-in-JS (styled-components, emotion).

**CSS stack:**
- `index.css` — design tokens (CSS vars) + `@theme` mapping. Component classes are not written here.
- Tailwind utility classes in `className=""` — the only way to style components.
- shadcn/ui — ready-made components with Tailwind classes, customizable through tokens.
- Animations: Tailwind built-in (`transition-*`, `animate-*`) + custom `@keyframes` in `index.css` when needed.

**Exceptions (only acceptable `style={}`):**
- Dynamic values from JS (e.g., `style={{ width: \`${percentage}%\` }}`) — when the value is not known at compile-time
- AG Grid cell renderer (AG Grid enforces the style API in certain contexts)

**Rationale:**
- Native CSS = zero JS runtime overhead (vs CSS-in-JS)
- Tailwind = design system enforcement (you cannot use a color outside the palette)
- Readability: classes in JSX + tokenized CSS = one truth location per concern
- SCSS is unnecessary — Tailwind v4 has nesting, variables, @apply natively

## Source provenance

- Original source: legacy decision log
- Pre-atomization path: `docs/history/decision-log.md`
- Original identifier: `DEC-042`
- Original order: 42 of 59
- Original source lines: 794–814
- Frozen source commit: `582b3e8b147293c7b33dd0f839839aa81d7c8c20`
