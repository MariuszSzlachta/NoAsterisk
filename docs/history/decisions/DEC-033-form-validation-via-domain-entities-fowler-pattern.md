# DEC-033 — Form Validation via Domain Entities (Fowler Pattern)

## Source Status

Historical decision recorded on 2026-06-25. The source provides an explicit decision statement. The source does not assign a separate lifecycle status to this record. Chronological presence does not prove current authority.

## Preserved Decision Record

**Date:** 2026-06-25

**Decision:** Form validation does not occur in the UI layer — form values are mapped to entities, entities validate (invariants + injected validators), domain errors are mapped to UI field errors.

**Flow:**
```
form.values → Entity.create(values) or entity.update(values)
  ├─ success → mapper → ViewModel → store update
  └─ DomainError[] → mapDomainErrorsToFieldErrors() → form shows inline errors
```

**Rationale:**
- Single source of truth for validation rules (domain entity, not form schema)
- Separation of concerns: API boundary (DTO validation) ≠ domain validation (business rules)
- Consistency: backend and frontend have the same rules implemented in entities
- Testability: entity.validate() is testable without React/form framework

**Responsibility on the frontend:** used in `infrastructure/` for validating API responses (runtime type check), NOT for validating user input (this is handled by entities)

## Source Provenance

- Original source: legacy decision log
- Pre-atomization path: `docs/history/decision-log.md`
- Original identifier: `DEC-033`
- Original order: 33 of 59
- Original source lines: 583–602
- Frozen source commit: `582b3e8b147293c7b33dd0f839839aa81d7c8c20`
