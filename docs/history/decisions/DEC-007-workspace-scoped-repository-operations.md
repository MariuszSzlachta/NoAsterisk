# DEC-007 — Workspace-scoped Repository Operations

## Source status

Historical decision recorded on 2026-06-20. The source provides an explicit decision statement. The source does not assign a separate lifecycle status to this record. Chronological presence does not prove current authority.

## Preserved decision record

**Decision:** All repository operations regarding tenant-specific data must include `workspaceId` in the port signature.

**Rationale:** Prevents cross-workspace data leaks (IDOR). The port enforces the correct contract.

**Applies to:** `existsByContentHash`, `deleteByBatchId`, `findByBatchHash`, future methods.

**Note:** In-memory implementation ignores the parameter (single-tenant in tests). PostgreSQL MUST filter in the WHERE clause.

## Source provenance

- Original source: legacy decision log
- Pre-atomization path: `docs/history/decision-log.md`
- Original identifier: `DEC-007`
- Original order: 7 of 59
- Original source lines: 92–100
- Frozen source commit: `582b3e8b147293c7b33dd0f839839aa81d7c8c20`
