# DEC-015 — Pagination Delegated to the Repository (Not in the Handler)

## Source Status

Historical decision recorded on 2026-06-21. The source provides an explicit decision statement. The source does not assign a separate lifecycle status to this record. Chronological presence does not prove current authority.

## Preserved Decision Record

**Date:** 2026-06-21

**Decision:** The `ImportBatchRepository` port has `findPaged(workspaceId, PageOptions)`. The handler calls the repository and maps the result.

**Rejected:** The handler retrieves everything and slices it in JS.

**Rationale:**
- Postgres-ready — `findPaged` will translate to `OFFSET/LIMIT + ORDER BY`
- The handler should not know about pagination mechanics — this is the responsibility of the persistence layer
- In-memory implementation does sort + slice (acceptable for MVP)

## Source Provenance

- Original source: legacy decision log
- Pre-atomization path: `docs/history/decision-log.md`
- Original identifier: `DEC-015`
- Original order: 15 of 59
- Original source lines: 200–211
- Frozen source commit: `582b3e8b147293c7b33dd0f839839aa81d7c8c20`
