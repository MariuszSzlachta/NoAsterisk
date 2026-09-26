# DEC-036 — Dark mode from day 0, light as default

## Source status

Historical decision recorded on 2026-06-25. The source provides an explicit decision statement. The source does not assign a separate lifecycle status to this record. Chronological presence does not prove current authority.

## Preserved decision record

**Date:** 2026-06-25

**Decision:** Dark mode support built-in from the start (Tailwind `dark:` variant + CSS variables). Light mode as default. Every component MUST have a dark variant.

**Implementation:**
- CSS variables in `:root` (light) and `.dark` (dark)
- Tailwind `darkMode: 'class'` — toggle adds/removes `.dark` on `<html>`
- shadcn/ui by default supports both themes
- AG Grid — custom theme via CSS vars (ag-theme-alpine-dark)
- Nivo — color scheme prop per chart (behind a facade)

**Justification:**
- OCP-friendly: Adding dark mode later = refactor EVERY component. From the start = zero cost
- shadcn/ui and Tailwind have dark mode for free — just need to not ignore it
- Storybook toolbar toggle allows testing both themes without deploy

## Source provenance

- Original source: legacy decision log
- Pre-atomization path: `docs/history/decision-log.md`
- Original identifier: `DEC-036`
- Original order: 36 of 59
- Original source lines: 658–674
- Frozen source commit: `582b3e8b147293c7b33dd0f839839aa81d7c8c20`
