# DEC-041 — Design System Tokens from the Reference Prototype

## Source status

Historical decision recorded on 2026-06-26. The source provides an explicit decision statement. The source does not assign a separate lifecycle status to this record. Chronological presence does not prove current authority.

## Preserved decision record

**Date:** 2026-06-26

**Decision:** Base the design system on tokens extracted from the approved
reference prototype. The interactive mockup with a theme toggle is stored in
[`docs/design/mockups/`](../../design/mockups/).

**Source of truth:** `client/src/index.css` — CSS variables + Tailwind `@theme` mapping.

**Dark palette (default):**
- Surfaces: `--bg: #0a0b0e`, `--surface: #101319`, `--surface-2: #161a22`, `--surface-3: #1c212b`
- Text: `--fg: #e8eaee`, `--fg-muted: #8b929e`, `--fg-subtle: #5d6470`
- Primary: `--primary: #3b82f6` (blue-500)
- Financial: `--income: #34d399`, `--expense: #fb7185`, `--warning: #fbbf24`
- Chart palette: 6 colors per category (groceries, transport, subscriptions, dining, bills, entertainment)

**Typography:** Geist (sans) + Geist Mono (numbers, code). Google Fonts. `font-feature-settings: 'cv01', 'ss01'`, tabular-nums on amounts.

**Dark mode strategy:** `class="dark"` on `<html>` (Tailwind class strategy). Dark as default. Light via `.light` class.

**Rationale:**
- Keep tokens aligned with the approved prototype so implementation and visual
  reference use the same values.
- CSS variables → Tailwind `@theme` → utility classes → zero inline styles
- Hex values (not oklch) — more readable, debuggable, compatible with AG Grid `--ag-*` vars

## Source provenance

- Original source: legacy decision log
- Pre-atomization path: `docs/history/decision-log.md`
- Original identifier: `DEC-041`
- Original order: 41 of 59
- Original source lines: 768–790
- Frozen source commit: `582b3e8b147293c7b33dd0f839839aa81d7c8c20`
