# DEC-016 — Auth — JWT access token only (no refresh)

## Source status

Historical decision recorded on 2026-06-22. The source provides an explicit decision statement. The source does not assign a separate lifecycle status to this record. Chronological presence does not prove current authority.

## Preserved decision record

**Date:** 2026-06-22

**Decision:** Authentication via JWT access token (24h TTL). No refresh token flow for MVP.

**Justification:**
- Simplicity — one token, one guard, zero token rotation logic
- 24h TTL acceptable for MVP (user logs in once per day)
- Refresh token will be added later without changing the interface (new endpoint + middleware)

**Rejected:** Refresh token flow (unnecessary complexity at this stage).

## Source provenance

- Original source: legacy decision log
- Pre-atomization path: `docs/history/decision-log.md`
- Original identifier: `DEC-016`
- Original order: 16 of 59
- Original source lines: 217–228
- Frozen source commit: `582b3e8b147293c7b33dd0f839839aa81d7c8c20`
