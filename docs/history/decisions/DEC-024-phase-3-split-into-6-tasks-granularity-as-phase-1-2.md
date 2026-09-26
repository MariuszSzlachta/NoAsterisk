# DEC-024 — Phase 3 Split into 6 Tasks (Granularity as Phase 1/2)

## Source status

Historical decision recorded on 2026-06-24. The source provides an explicit decision statement. The source does not assign a separate lifecycle status to this record. Chronological presence does not prove current authority.

## Preserved decision record

**Date:** 2026-06-24

**Decision:** Import Profiles split into 6 separate tasks instead of 3. Each task is testable in isolation.

**Split into:**
1. Entity + value objects (ColumnMapping, ParserConfig, AnonymizationConfig)
2. Repository port + in-memory adapter
3. Create + Update handlers
4. Get + Delete handlers + controller + Zod DTOs
5. Profile auto-detect (matching profile based on CSV headers)
6. Integration with import flow (optional profileId)

**Justification:**
- The previous 3 bullet points were too broad — entity with 3-4 value objects + full CRUD + integration was too much for one commit/review
- The "Content hash + dedup" point was unclear — content hash per row already exists (Phase 1). Removed as a duplicate.
- Auto-detect (bank recognition based on headers) is a separate logic worth isolating
- Integration with import flow separately — allows testing profiles independently of import

**Pattern:** Phases 1/2/2.5 had 5 tasks each — this granularity proved effective (98→152→204 tests, each step reviewable).

## Source provenance

- Original source: legacy decision log
- Pre-atomization path: `docs/history/decision-log.md`
- Original identifier: `DEC-024`
- Original order: 24 of 59
- Original source lines: 335–355
- Frozen source commit: `582b3e8b147293c7b33dd0f839839aa81d7c8c20`
