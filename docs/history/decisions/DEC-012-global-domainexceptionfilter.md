# DEC-012 — Global DomainExceptionFilter

## Source status

Historical decision recorded on 2026-06-20. The source provides an explicit decision statement. The source does not assign a separate lifecycle status to this record. Chronological presence does not prove current authority.

## Preserved decision record

**Date:** 2026-06-20

**Decision:** Global exception filter maps `DomainError` → 400 Bad Request. Controller may override (e.g., `BatchAlreadyImportedError` → 409).

**Justification:**
- Without filter — `DomainError` goes as 500 Internal Server Error (leaks stack trace to stdout)
- Controller catch is first in the chain — may map specific errors to specific HTTP status codes
- Fallback to 400 is safe — `DomainError` is always "client sent something invalid"

## Source provenance

- Original source: legacy decision log
- Pre-atomization path: `docs/history/decision-log.md`
- Original identifier: `DEC-012`
- Original order: 12 of 59
- Original source lines: 155–164
- Frozen source commit: `582b3e8b147293c7b33dd0f839839aa81d7c8c20`
