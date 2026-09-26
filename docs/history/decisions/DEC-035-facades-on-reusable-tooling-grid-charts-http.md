# DEC-035 — Facades on Reusable Tooling (Grid, Charts, HTTP)

## Source status

Historical decision recorded on 2026-06-25. The source provides an explicit decision statement. The source does not assign a separate lifecycle status to this record. Chronological presence does not prove current authority.

## Preserved decision record

**Date:** 2026-06-25

**Decision:** External libraries with risk of replacement are hidden behind port/adapter interfaces:

1. **Charts** — `shared/charts/ports/` interface + `shared/charts/adapters/nivo/` implementation
2. **Grid** — `shared/grid/ports/` interface + `shared/grid/adapters/ag-grid/` implementation
3. **State (store)** — per feature `domain/ports/` interface + `infrastructure/store/` Zustand implementation
4. **State (server)** — per feature `infrastructure/api/` TanStack Query with typed hooks
5. **HTTP** — `shared/api/` typed client (fetch wrapper, replaceable with axios)

**Justification:**
- Monetization of the app → possible switch to a paid chart library (Highcharts, ECharts Pro)
- AG Grid Community → Enterprise upgrade = 1 adapter change
- Zustand → Jotai/Signals = 1 infrastructure file per feature
- Consistency with BE: same port/adapter pattern, same mindset of replaceability

## Source provenance

- Original source: legacy decision log
- Pre-atomization path: `docs/history/decision-log.md`
- Original identifier: `DEC-035`
- Original order: 35 of 59
- Original source lines: 638–654
- Frozen source commit: `582b3e8b147293c7b33dd0f839839aa81d7c8c20`
