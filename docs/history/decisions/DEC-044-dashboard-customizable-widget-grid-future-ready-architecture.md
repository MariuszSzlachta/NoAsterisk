# DEC-044 — Dashboard — customizable widget grid (future-ready architecture)

## Source status

Historical decision recorded on 2026-06-26. The source provides an explicit decision statement. The source does not assign a separate lifecycle status to this record. Chronological presence does not prove current authority.

## Preserved decision record

**Date:** 2026-06-26

**Decision:** Dashboard components are built as standalone widgets with a standardized interface. The architecture is designed from the beginning to support:
- Resize (changing widget size)
- Drag & drop (changing order/position)
- Custom widgets (user adds their own — premium feature)

**Implications for implementation:**
- Each widget is a separate component with an interface `DashboardWidget` (id, defaultSize, minSize, component)
- Dashboard layout is described as an array of widgets with positions (persisted in the backend per user)
- Widget components do NOT know about their size/position — they are given a slot and fill it responsively
- Widget registry (Record<WidgetType, WidgetComponent>) — OCP-friendly, adding a widget = 1 entry
- CSS Grid with `grid-template-areas` or library (react-grid-layout) underneath — behind a facade

**MVP:** Fixed layout (KPI cards → charts → budgets + recent). But components are already compatible with the widget interface.

**Post-MVP (premium):**
- `PATCH /user/dashboard-layout` — persists widget positions/sizes
- Drag & drop via react-grid-layout (behind a facade in `shared/`)
- Widget marketplace: user adds/removes widgets from the catalog

**Justification:**
- Adding customization later without the widget interface would require a refactor of every dashboard component
- Widget interface from day 0 = zero cost now, zero refactoring later
- Premium feature (monetization) — the architecture must be ready

## Source provenance

- Original source: legacy decision log
- Pre-atomization path: `docs/history/decision-log.md`
- Original identifier: `DEC-044`
- Original order: 44 of 59
- Original source lines: 834–860
- Frozen source commit: `582b3e8b147293c7b33dd0f839839aa81d7c8c20`
