# DEC-028 — State Management with Zustand and TanStack Query (Adapter on FE)

## Source status

Historical decision recorded on 2026-06-25. The source provides an explicit decision statement. The source does not assign a separate lifecycle status to this record. Chronological presence does not prove current authority.

## Preserved decision record

**Date:** 2026-06-25

**Decision:** Implementations of Zustand store and TanStack Query are hidden behind interfaces/facades — like a port/adapter on the backend. Consumers (hooks, components) are unaware of the specific library.

**Pattern:**
```typescript
// domain/ports/import-state.port.ts — interface
interface ImportStatePort {
  readonly rows: ReadonlyArray<TransactionViewModel>;
  addRows(rows: TransactionViewModel[]): void;
  updateRow(id: string, vm: TransactionViewModel): void;
}

// infrastructure/import-state.zustand.ts — implementation
const useImportStoreInternal = create<...>(...);
export const useImportState = (): ImportStatePort => useImportStoreInternal();

// application/useImportWizard.ts — consumes the port, not Zustand
const { rows, addRows } = useImportState();
```

**Justification:**
- Zustand → Jotai/Signals/other = 1 file change (infrastructure adapter)
- TanStack Query → SWR/other = 1 file change
- Testing: mock the port in tests without mocking Zustand internals
- Consistency with backend: same pattern (port interface + adapter implementation + DI)

## Source provenance

- Original source: legacy decision log
- Pre-atomization path: `docs/history/decision-log.md`
- Original identifier: `DEC-028`
- Original order: 28 of 59
- Original source lines: 473–500
- Frozen source commit: `582b3e8b147293c7b33dd0f839839aa81d7c8c20`
