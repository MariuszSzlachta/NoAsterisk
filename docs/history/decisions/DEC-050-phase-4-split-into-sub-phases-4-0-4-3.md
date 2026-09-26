# DEC-050 — Phase 4 Split into Sub-Phases (4.0 → 4.3)

## Source status

Historical decision recorded on 2026-06-26. The source provides an explicit decision statement. The source does not assign a separate lifecycle status to this record. Chronological presence does not prove current authority.

## Preserved decision record

**Date:** 2026-06-26

**Decision:** Frontend Phase 4 split into 4 sub-phases with granular bullet points:
- **4.0** — Setup (✅ done)
- **4.1** — App Shell (sidebar, topbar, layout with Outlet)
- **4.2** — Dashboard Widgets (KPI cards, charts, recent transactions, composition)
- **4.3** — CSV Import Flow (parser, grid, batch edit, anonymization, API)

**Justification:**
- Original Phase 4 had 6 bullet points from setup to API integration — too broad
- Layout shell is a prerequisite for everything else (routing with Outlet, navigation)
- Dashboard is a separate surface area independent of import flow
- Each sub-phase is testable and reviewable in isolation
- In line with DEC-024 (granularity as in Phase 3: 6 tasks)

**Pattern:** One bullet per one component or one wiring — no more than ~2–3 new files per bullet.

## Related records

- [DEC-024](./DEC-024-phase-3-split-into-6-tasks-granularity-as-phase-1-2.md)

## Source provenance

- Original source: legacy decision log
- Pre-atomization path: `docs/history/decision-log.md`
- Original identifier: `DEC-050`
- Original order: 51 of 59
- Original source lines: 961–978
- Frozen source commit: `582b3e8b147293c7b33dd0f839839aa81d7c8c20`
