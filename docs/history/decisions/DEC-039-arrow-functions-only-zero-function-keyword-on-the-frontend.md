# DEC-039 — Arrow functions only (zero `function` keyword on the frontend)

## Source status

Historical decision recorded on 2026-06-25. The source provides an explicit decision statement. The source does not assign a separate lifecycle status to this record. Chronological presence does not prove current authority.

## Preserved decision record

**Date:** 2026-06-25

**Decision:** All frontend code (components, hooks, handlers, utils) uses arrow functions. Zero `function` keyword.

**Justification:** Consistency, no hoisting (predictable), shorter syntax, safe this-binding.

## Source provenance

- Original source: legacy decision log
- Pre-atomization path: `docs/history/decision-log.md`
- Original identifier: `DEC-039`
- Original order: 39 of 59
- Original source lines: 732–738
- Frozen source commit: `582b3e8b147293c7b33dd0f839839aa81d7c8c20`
