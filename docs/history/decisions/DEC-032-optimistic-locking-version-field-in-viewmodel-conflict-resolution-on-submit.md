# DEC-032 — Optimistic locking — version field in ViewModel, conflict resolution on submit

## Source status

Historical decision recorded on 2026-06-25. The source provides an explicit decision statement. The source does not assign a separate lifecycle status to this record. Chronological presence does not prove current authority.

## Preserved decision record

**Date:** 2026-06-25

**Decision:** ViewModels hold `version: number` (from API response). On PATCH/PUT, we send the version — the backend checks it, and returns a 409 conflict if there is a conflict. The frontend rolls back and shows the conflict UI.

**Flow:**
```
Edit locally (vm.version = 3) → PATCH { ...changes, version: 3 }
Backend: current == 3? → YES → save, return { version: 4 }
                       → NO  → 409 Conflict { currentVersion: 5 }
Front: 409 → rollback local state, show conflict resolution UI
```

**MVP Scope:** The version field exists in DTO and ViewModel from the beginning. Full conflict resolution UI — post-MVP (for now, a simple "refresh and try again" message).

**Justification:**
- Shared workspaces = parallel edits = need for locking
- Optimistic (not pessimistic) — better UX, zero blocking
- Version in ViewModel from the beginning = zero breaking changes when adding conflict UI

## Source provenance

- Original source: legacy decision log
- Pre-atomization path: `docs/history/decision-log.md`
- Original identifier: `DEC-032`
- Original order: 32 of 59
- Original source lines: 560–579
- Frozen source commit: `582b3e8b147293c7b33dd0f839839aa81d7c8c20`
