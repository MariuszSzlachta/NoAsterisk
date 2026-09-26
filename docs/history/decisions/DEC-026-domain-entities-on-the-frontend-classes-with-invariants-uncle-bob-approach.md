# DEC-026 — Domain Entities on the Frontend — Classes with Invariants (Uncle Bob Approach)

## Source Status

Historical decision recorded on 2026-06-25. The source provides an explicit decision statement. The source does not assign a separate lifecycle status to this record. Chronological presence does not prove current authority.

## Preserved Decision Record

**Date:** 2026-06-25

**Decision:** Frontend domain entities are TypeScript classes with full invariant guards (as on the backend). An entity is either valid or does not exist. They are not "data models" — they have behavior.

**Pattern:**
```typescript
class Transaction {
  private constructor(readonly id: string, readonly amount: Money, ...) {}

  static create(props: CreateProps): Transaction { /* validates, throws DomainError */ }
  static fromViewModel(vm: TransactionViewModel): Transaction { /* reconstitution */ }

  anonymize(result: AnonymizationResult): Transaction { /* returns new instance */ }
  assignCategory(categoryId: string): Transaction { /* returns new instance */ }
  validateForImport(validator: TransactionValidator): DomainError[] { /* port-based */ }

  toData(): TransactionData { /* plain object snapshot */ }
}
```

**Rationale:**
- A lot of logic lives on the frontend: anonymization, PII detection, column mapping, content hash, batch edit, categorization
- Functional entities (const obj + utility functions) do not guarantee invariants — someone creates an invalid object from the side
- The entity does not live in the Zustand store (where ViewModels are) — so there is no problem with serialization/immer/Proxy
- Consistency with the backend: the same mental model (factory create, reconstitute, behavior methods, immutable returns)
- The entity is a transient boundary guard — created upon data input into the system and during operations, not persisted in the store

**Rejected:** Functional entities (const TransactionEntity = { create(), anonymize() }) — no guarantees of invariants, no encapsulation.

## Source Provenance

- Original source: legacy decision log
- Pre-atomization path: `docs/history/decision-log.md`
- Original identifier: `DEC-026`
- Original order: 26 of 59
- Original source lines: 410–439
- Frozen source commit: `582b3e8b147293c7b33dd0f839839aa81d7c8c20`
