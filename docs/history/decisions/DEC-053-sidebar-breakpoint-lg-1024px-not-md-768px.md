# DEC-053 — Sidebar breakpoint lg (1024px), not md (768px)

## Source status

Historical decision recorded on 2026-06-26. The source provides an explicit decision statement. The source does not assign a separate lifecycle status to this record. Chronological presence does not prove current authority.

## Preserved decision record

**Date:** 2026-06-26

**Decision:** Sidebar visible from `lg` (≥1024px). Below that — hamburger menu with overlay.

**Rejected:** `md` (768px) — sidebar 236px on 768px tablet leaves 532px for content = cut-off topbar, tight layout.

**Breakpoints:**
- **<640px (sm)**: mobile — hamburger, no CTA, no search, title 16px
- **640-1023px (sm-lg)**: tablet — hamburger, CTA visible, no search
- **≥1024px (lg)**: desktop — sidebar fixed, full topbar with search

**Responsive rules:**
- Sidebar: `hidden lg:block` (fixed) + overlay `lg:hidden` (mobile)
- Search: `hidden lg:block`
- CTA: `hidden sm:block`
- Breadcrumb: `hidden lg:flex`
- Content padding: `p-4 lg:p-6`

## Source provenance

- Original source: legacy decision log
- Pre-atomization path: `docs/history/decision-log.md`
- Original identifier: `DEC-053`
- Original order: 54 of 59
- Original source lines: 1030–1048
- Frozen source commit: `582b3e8b147293c7b33dd0f839839aa81d7c8c20`
