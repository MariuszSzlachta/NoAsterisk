# DEC-013 — "Not found" — handler returns undefined, controller throws NotFoundException

## Source status

Historical decision recorded on 2026-06-21. The source provides an explicit decision statement. The source does not assign a separate lifecycle status to this record. Chronological presence does not prove current authority.

## Preserved decision record

**Date:** 2026-06-21

**Decision:** Query/command handlers return `undefined`/`false` when the resource does not exist. The controller maps this to NestJS `NotFoundException` (HTTP 404).

**Rejected:** Throwing `DomainError` from the handler (maps to 400 via the global filter — semantically incorrect).

**Rationale:**
- 400 = "your request is invalid" (validation), 404 = "resource does not exist" — these are different situations
- The application layer should not be aware of HTTP status codes — it returns data or the absence of data
- The controller is an HTTP adapter — it decides on the status

## Source provenance

- Original source: legacy decision log
- Pre-atomization path: `docs/history/decision-log.md`
- Original identifier: `DEC-013`
- Original order: 13 of 59
- Original source lines: 170–181
- Frozen source commit: `582b3e8b147293c7b33dd0f839839aa81d7c8c20`
