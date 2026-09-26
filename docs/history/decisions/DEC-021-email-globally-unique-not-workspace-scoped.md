# DEC-021 — Email globally unique (not workspace-scoped)

## Source status

Historical decision recorded on 2026-06-22. The source provides an explicit decision statement. The source does not assign a separate lifecycle status to this record. Chronological presence does not prove current authority.

## Preserved decision record

**Date:** 2026-06-22

**Decision:** Email is globally unique in the system — `findByEmail(email)` and `existsByEmail(email)` do not accept `workspaceId`.

**Rationale:**
- Standard SaaS: login = email + password. Email identifies the user, not the workspace.
- The user belongs to a workspace (via `workspaceId` on the entity), but logs in using an email independent of the workspace.
- If email were per-workspace, the same email could have different passwords in different workspaces — UX horror.

**Exception to AP-5:** The repo port is documented with a comment explaining the lack of workspace scope (see AP-12).

## Source provenance

- Original source: legacy decision log
- Pre-atomization path: `docs/history/decision-log.md`
- Original identifier: `DEC-021`
- Original order: 21 of 59
- Original source lines: 291–302
- Frozen source commit: `582b3e8b147293c7b33dd0f839839aa81d7c8c20`
