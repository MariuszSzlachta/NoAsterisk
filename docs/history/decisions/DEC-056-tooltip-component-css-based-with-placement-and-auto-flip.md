# DEC-056 — Tooltip component — CSS-based with placement and auto-flip

## Source status

Historical decision recorded on 2026-06-27. The source provides an explicit decision statement. The source does not assign a separate lifecycle status to this record. Chronological presence does not prove current authority.

## Preserved decision record

**Date:** 2026-06-27

**Decision:** Tooltip in `shared/ui/Tooltip` — lightweight, with no external dependencies (no Radix/Floating UI):
- Pure CSS visibility: `group-hover` + `group-focus-within` (keyboard accessible)
- `placement` prop: `'top' | 'bottom' | 'left' | 'right'` (default: `'top'`)
- Auto-flip: on `mouseenter`/`focus` checks `getBoundingClientRect()` vs viewport — if there's no space, flips to the opposite side
- Accessibility: `tabIndex={0}`, `aria-describedby` + `useId()`, `role="tooltip"`
- String-only content (not ReactNode) — for rich content, the future Popover will be used
- `data-placement` attribute for testability

**Rationale:**
- The project does not use Radix — adding a heavy library for a single tooltip is overkill
- CSS group-hover + focus-within = zero JS state, zero re-renders
- Auto-flip solves the KPI card issue when cards are at the top of the screen (tooltip top would fly out of the viewport)
- No `overflow-hidden` on Card/KpiCard — tooltip with `position: absolute` + `z-50` is visible without portals
- Alternative (portal-based) is unnecessary — no container on the path cuts off

**Tradeoffs:**
- No smart repositioning (Floating UI quality) — simple flip on four directions is sufficient
- String-only: sufficient for infotips, future Popover for rich content

## Source provenance

- Original source: legacy decision log
- Pre-atomization path: `docs/history/decision-log.md`
- Original identifier: `DEC-056`
- Original order: 57 of 59
- Original source lines: 1087–1108
- Frozen source commit: `582b3e8b147293c7b33dd0f839839aa81d7c8c20`
