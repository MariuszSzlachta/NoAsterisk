# DEC-010 — Plugin Architecture for PII Rules (NestJS Multi-Provider)

## Source Status

Historical decision recorded on 2026-06-20. The source provides an explicit decision statement. The source does not assign a separate lifecycle status to this record. Chronological presence does not prove current authority.

## Preserved Decision Record

**Date:** 2026-06-20

**Decision:** PII rules are registered via the `PII_RULES` DI token (useFactory), service receives `PiiRule[]`.

**Justification:**
- Adding a new rule = 1 class + 1 line in the module providers
- Zero changes in the service
- Each rule is testable in isolation (it.each with case arrays)
- Future: dictionary rules, NLP rules — same interface

## Source Provenance

- Original source: legacy decision log
- Pre-atomization path: `docs/history/decision-log.md`
- Original identifier: `DEC-010`
- Original order: 10 of 59
- Original source lines: 128–138
- Frozen source commit: `582b3e8b147293c7b33dd0f839839aa81d7c8c20`
