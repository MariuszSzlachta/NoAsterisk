# DEC-031 — TanStack Query for server state, Zustand for local/domain state

## Source status

Historical decision recorded on 2026-06-25. The source provides an explicit decision statement. The source does not assign a separate lifecycle status to this record. Chronological presence does not prove current authority.

## Preserved decision record

**Date:** 2026-06-25

**Decision:** Two state management patterns:
- **TanStack Query** — server state (data fetching, caching, background refetch, mutations with optimistic updates)
- **Zustand** — local state (import pipeline, UI state, in-memory edits before submit)

**Boundary:** If data comes from an API and should be cached/refetchable → TanStack Query. If data exists only within the session (CSV parse results, edits before submit, UI selections) → Zustand.

**Rationale:**
- TanStack Query handles: cache invalidation, stale-while-revalidate, optimistic updates, retry
- Zustand handles: complex local state machines (import wizard steps), in-browser-only data (parsed CSV)
- No global "god store" — each feature has its own Zustand + its own TQ queries
- Both are hidden behind facades (DEC-028) — interchangeability is preserved

## Related records

- [DEC-028](./DEC-028-state-management-with-zustand-and-tanstack-query-adapter-on-fe.md)

## Source provenance

- Original source: legacy decision log
- Pre-atomization path: `docs/history/decision-log.md`
- Original identifier: `DEC-031`
- Original order: 31 of 59
- Original source lines: 542–556
- Frozen source commit: `582b3e8b147293c7b33dd0f839839aa81d7c8c20`
