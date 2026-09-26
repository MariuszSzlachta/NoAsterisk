# DEC-008 — BatchAlreadyImportedError instead of silent return

## Source status

Historical decision recorded on 2026-06-20. The source provides an explicit decision statement. The source does not assign a separate lifecycle status to this record. Chronological presence does not prove current authority.

## Preserved decision record

**Decision:** Duplicate batch hash throws a typed error (`BatchAlreadyImportedError`) instead of returning `{saved: 0}`.

**Rationale:**
- The controller can map this to an appropriate HTTP status (409 Conflict)
- Clear semantics — error vs empty success represent different situations
- The caller must explicitly handle this case

## Source provenance

- Original source: legacy decision log
- Pre-atomization path: `docs/history/decision-log.md`
- Original identifier: `DEC-008`
- Original order: 8 of 59
- Original source lines: 104–111
- Frozen source commit: `582b3e8b147293c7b33dd0f839839aa81d7c8c20`
