# DEC-030 — Immer Middleware in Zustand — Allowed (Entities Do Not Live in the Store)

## Source Status

Historical decision recorded on 2026-06-25. The source provides an explicit decision statement. The source does not assign a separate lifecycle status to this record. Chronological presence does not prove current authority.

## Preserved Decision Record

**Date:** 2026-06-25

**Decision:** Immer middleware is used in Zustand stores for convenient immutable updates. It does not conflict with class-based entities because entities do NOT live in the store (the store holds plain ViewModels).

**Justification:**
- Immer + Proxy does not work with classes (loses prototype, private fields)
- But the store holds ONLY plain objects (ViewModels) — Immer works perfectly
- Entities are transient — created for validation/operations, never persisted in the store
- Developer experience: `state.rows[idx].title = newTitle` instead of spread hell

## Source Provenance

- Original source: legacy decision log
- Pre-atomization path: `docs/history/decision-log.md`
- Original identifier: `DEC-030`
- Original order: 30 of 59
- Original source lines: 528–538
- Frozen source commit: `582b3e8b147293c7b33dd0f839839aa81d7c8c20`
