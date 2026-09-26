# DEC-029 — Mappers on Every Boundary (FE Identically as BE)

## Source Status

Historical decision recorded on 2026-06-25. The source provides an explicit decision statement. The source does not assign a separate lifecycle status to this record. Chronological presence does not prove current authority.

## Preserved Decision Record

**Date:** 2026-06-25

**Decision:** Three types of mappers, separate per boundary:
1. **DTO → Entity** (infrastructure): data from the API passes through domain validation
2. **Entity → ViewModel** (application): entity mapped to a UI-ready display object
3. **Entity → DTO** (infrastructure): entity mapped to the API request contract

**Location:**
```
features/{name}/
  application/mappers/     ← Entity ↔ ViewModel
  infrastructure/mappers/  ← DTO ↔ Entity
```

**Justification:**
- Change in API (DTO) = 1 mapper change, UI is unaware
- Change in UI (adding a field in VM) = 1 mapper change, API is unaware
- Entity never leaks out of the domain/application layer
- Consistent with the backend: Persistence ↔ Entity ↔ ResponseDTO = here DTO ↔ Entity ↔ ViewModel

## Source Provenance

- Original source: legacy decision log
- Pre-atomization path: `docs/history/decision-log.md`
- Original identifier: `DEC-029`
- Original order: 29 of 59
- Original source lines: 504–524
- Frozen source commit: `582b3e8b147293c7b33dd0f839839aa81d7c8c20`
