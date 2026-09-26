# DEC-020 — workspaceId in JWT claims — end of TEMP_WORKSPACE_ID

## Source status

Historical decision recorded on 2026-06-22. The source provides an explicit decision statement. The source does not assign a separate lifecycle status to this record. Chronological presence does not prove current authority.

## Preserved decision record

**Date:** 2026-06-22

**Decision:** JWT payload contains `{ sub: userId, workspaceId, role }`. Guard parses the token → `@CurrentUser()` decorator extracts the data. Removal of hardcoded `TEMP_WORKSPACE_ID` from controllers.

**Justification:**
- workspaceId in token = zero additional DB lookups per request
- Guard + decorator = clean separation — controller does not know about JWT mechanics
- Future: multi-workspace user → user selects workspace → token changes

## Source provenance

- Original source: legacy decision log
- Pre-atomization path: `docs/history/decision-log.md`
- Original identifier: `DEC-020`
- Original order: 20 of 59
- Original source lines: 278–287
- Frozen source commit: `582b3e8b147293c7b33dd0f839839aa81d7c8c20`
