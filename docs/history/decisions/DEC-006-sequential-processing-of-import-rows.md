# DEC-006 — Sequential Processing of Import Rows

## Source status

Historical decision recorded on 2026-06-20. The source provides an explicit decision statement. The source does not assign a separate lifecycle status to this record. Chronological presence does not prove current authority.

## Preserved decision record

**Decision:** The import handler processes rows sequentially (for...of), not in parallel.

**Rationale:**
- Eliminates race conditions on dedup check
- Does not exhaust the PostgreSQL connection pool
- Simpler reasoning for error handling

**Future:** Unit of Work + UNIQUE constraint + optimistic locking with PostgreSQL.

## Source provenance

- Original source: legacy decision log
- Pre-atomization path: `docs/history/decision-log.md`
- Original identifier: `DEC-006`
- Original order: 6 of 59
- Original source lines: 79–88
- Frozen source commit: `582b3e8b147293c7b33dd0f839839aa81d7c8c20`
