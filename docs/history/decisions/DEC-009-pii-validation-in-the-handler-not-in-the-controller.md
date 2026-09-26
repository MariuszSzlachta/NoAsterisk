# DEC-009 — PII validation in the handler, not in the controller

## Source status

Historical decision recorded on 2026-06-20. The source provides an explicit decision statement. The source does not assign a separate lifecycle status to this record. Chronological presence does not prove current authority.

## Preserved decision record

**Date:** 2026-06-20

**Decision:** PII validation + row partitioning lives in `ImportTransactionsHandler`, not in the controller.

**Rationale:**
- PII validation + import is one use case — the handler orchestrates both steps
- If we add another entry point (CLI import, scheduled import) — the logic does not need to be repeated
- The controller is thin: validate input (Zod) → delegate → map HTTP status

## Source provenance

- Original source: legacy decision log
- Pre-atomization path: `docs/history/decision-log.md`
- Original identifier: `DEC-009`
- Original order: 9 of 59
- Original source lines: 115–124
- Frozen source commit: `582b3e8b147293c7b33dd0f839839aa81d7c8c20`
