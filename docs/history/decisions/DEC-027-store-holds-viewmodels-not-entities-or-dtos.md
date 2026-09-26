# DEC-027 — Store holds ViewModels, not entities or DTOs

## Source status

Historical decision recorded on 2026-06-25. The source provides an explicit decision statement. The source does not assign a separate lifecycle status to this record. Chronological presence does not prove current authority.

## Preserved decision record

**Date:** 2026-06-25

**Decision:** The feature-specific state store holds ViewModels (plain objects, UI-ready). It does not hold entities (classes) or raw DTOs from the API.

**Store content:**
```typescript
interface ImportStoreState {
  rows: TransactionViewModel[];     // ← plain objects, display-ready
  selectedIds: Set<string>;         // ← UI state
  step: ImportStep;                 // ← UI state
}
```

**Flow:**
```
Data coming in (CSV/API) → Entity.create() → mapper → ViewModel → store
Operation (edit/categorize) → Entity.fromViewModel(vm) → entity.method() → mapper → VM → store
Submission (submit) → Entity.fromViewModel(vm) → mapper → DTO → API
```

**Rationale:**
- VMs are plain objects — serialization, devtools, immer middleware work without issues
- Entities as transient objects — created for validation/operations, not persisted in the store
- DTOs do not enter the store directly — always mapped (API contract ≠ UI contract)
- Separation: domain state (rows data) and UI state (selections, panels) in separate sections of the store

## Source provenance

- Original source: legacy decision log
- Pre-atomization path: `docs/history/decision-log.md`
- Original identifier: `DEC-027`
- Original order: 27 of 59
- Original source lines: 443–469
- Frozen source commit: `582b3e8b147293c7b33dd0f839839aa81d7c8c20`
