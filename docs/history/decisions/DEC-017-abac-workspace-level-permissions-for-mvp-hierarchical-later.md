# DEC-017 — ABAC — workspace-level permissions for MVP, hierarchical later

## Source status

Historical decision recorded on 2026-06-22. The source provides an explicit decision statement. The source does not assign a separate lifecycle status to this record. Chronological presence does not prove current authority.

## Preserved decision record

**Date:** 2026-06-22

**Decision:** ABAC with `Permission` entity: `(userId, resourceType, resourceId, actions[])`. MVP: one record per user (workspace-level full access). Granular permissions (sub_budget level) added later.

**Model:**
```
Permission { userId, resourceType: 'workspace'|'sub_budget'|'account', resourceId, actions: ['read','write','delete','admin'] }
```

**Scalability:**
- MVP: 1 permission per user → 1 DB lookup per request (cacheable)
- Sharing: granular records at sub_budget level, hierarchical resolution (transaction → sub_budget → workspace)
- Port `PermissionRepositoryPort` isolates lookup logic — in-memory today, Redis-cached tomorrow

**Justification:** RBAC is too coarse-grained (wife sees "Home" but not corporate). ABAC solves this without custom roles per combination.

## Source provenance

- Original source: legacy decision log
- Pre-atomization path: `docs/history/decision-log.md`
- Original identifier: `DEC-017`
- Original order: 17 of 59
- Original source lines: 232–248
- Frozen source commit: `582b3e8b147293c7b33dd0f839839aa81d7c8c20`
