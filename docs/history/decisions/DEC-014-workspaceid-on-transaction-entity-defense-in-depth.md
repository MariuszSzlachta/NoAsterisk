# DEC-014 — workspaceId on Transaction entity (defense-in-depth)

## Source status

Historical decision recorded on 2026-06-21. The source provides an explicit decision statement. The source does not assign a separate lifecycle status to this record. Chronological presence does not prove current authority.

## Preserved decision record

**Date:** 2026-06-21

**Decision:** The `Transaction` entity has `workspaceId` as a required field with an invariant guard. Repository methods `existsByContentHash` and `deleteByBatchId` filter by `workspaceId`.

**Rationale:**
- Defense-in-depth — even if the handler overlooks the ownership check, the repository will not allow cross-tenant operations
- Content hash dedup must be per-workspace (import in workspace A does not block an identical import in workspace B)
- `deleteByBatchId` without a workspace filter = potential IDOR with overlapping UUIDs

**Implications:** Every `Transaction.create()` requires `workspaceId`. The persistence layer (record + mapper) stores and reconstructs the field.

## Source provenance

- Original source: legacy decision log
- Pre-atomization path: `docs/history/decision-log.md`
- Original identifier: `DEC-014`
- Original order: 14 of 59
- Original source lines: 185–196
- Frozen source commit: `582b3e8b147293c7b33dd0f839839aa81d7c8c20`
