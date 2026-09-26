# DEC-018 — UserRole — Superuser + Member (two-level)

## Source status

Historical decision recorded on 2026-06-22. The source provides an explicit decision statement. The source does not assign a separate lifecycle status to this record. Chronological presence does not prove current authority.

## Preserved decision record

**Date:** 2

**Decision:** Two roles: `Superuser` (admin endpoints: seed rules, system health) and `Member` (normal CRUD operations). Roles on User entity, not in permissions.

**Justification:**
- Superuser is a system-wide capability, not resource-level — does not fit ABAC
- Member + ABAC permissions = granular control per resource
- Future: if more roles are needed — extend enum, not redesign

## Source provenance

- Original source: legacy decision log
- Pre-atomization path: `docs/history/decision-log.md`
- Original identifier: `DEC-018`
- Original order: 18 of 59
- Original source lines: 252–261
- Frozen source commit: `582b3e8b147293c7b33dd0f839839aa81d7c8c20`
