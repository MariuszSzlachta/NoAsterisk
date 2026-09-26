# DEC-057 — Simplified frontend architecture — Layered FSD (no DDD/hexagonal)

## Source status

Historical decision recorded on 2026-06-27. The source provides an explicit decision statement. The source does not assign a separate lifecycle status to this record. Chronological presence does not prove current authority.

## Preserved decision record

**Date:** 2026-06-27

**Decision:** The frontend is abandoning DDD + hexagonal internals per feature. Instead — a simple layered FSD: `model/`, `api/`, `store/`, `ui/`. No entity classes, no ports on store, no three mapper layers.

**New structure per feature:**
```
features/{name}/
  model/                ← types + pure functions (validation, transformation, domain types)
    types.ts            ← interfaces (ViewModel, FormValues, domain types)
    validators.ts       ← validate(input) → errors[] (pure functions)
    transformers.ts     ← anonymize(), computeHash(), mapDtoToVm()

  api/                  ← TanStack Query hooks + DTO→ViewModel mappers
    use-{name}-query.ts
    use-{name}-mutation.ts
    mappers.ts          ← DTO → ViewModel (one layer)

  store/                ← Zustand (when needed — local/pipeline state)
    {name}-store.ts     ← direct hook, no port/facade

  ui/                   ← React components + orchestration hooks
    components/
    hooks/              ← use-case hooks (orchestrate model + api + store)

  index.ts              ← public API
```

**What is removed vs DEC-025/026/027/028/029:**
1. ~~Entity classes with private constructor + factory~~ → interfaces + pure validation functions
2. ~~Ports/facades on Zustand~~ → direct Zustand hook (swap Zustand = refactor store/ folder)
3. ~~Three mapper layers (DTO→Entity→ViewModel)~~ → one mapper DTO→ViewModel
4. ~~Folder `domain/` + `application/` + `infrastructure/`~~ → `model/` + `api/` + `store/` + `ui/`
5. ~~Fowler validation (Entity.create() → DomainError[])~~ → `validate(input): FieldErrors` pure function

**What remains:**
- FSD top-level (app/pages/features/entities/shared) — no changes
- Fasades on AG Grid, Nivo, HTTP client (shared/adapters/) — swap is real
- DTO→ViewModel mapper (one layer in `api/mappers.ts`)
- TanStack Query = server state, Zustand = local state (no changes)
- `index.ts` as public API per feature (encapsulation)
- Features do not import from each other
- Pages compose features (zero logic)

**Rationale:**
- The frontend does not have a persistence boundary to protect (store is cache, not a database)
- 1-2 ports per feature (store, API) — indirection is not worth it
- DTO from API and ViewModel are usually the same shape ± 1-2 fields — third object (Entity) is overhead
- Private constructors + factory methods = boilerplate without proportional value
- Validation as a pure function is simpler, testable the same way, without ceremony of classes
- Backend DDD protects persisted data invariants — frontend operates on transient UI state

**Exception:** CSV Import (Phase 4.3) may have a richer `model/` with more logic (anonymization, PII detection, content hash, column mapping). But still pure functions, no classes.

**Supersedes:** DEC-025 (partially), DEC-026, DEC-027 (partially), DEC-028, DEC-029 (partially), DEC-033. These decisions remain in the log as historical context but do not apply to new code.

## Related records

- [DEC-025](./DEC-025-frontend-architecture-feature-sliced-design-layered-internals.md)
- [DEC-026](./DEC-026-domain-entities-on-the-frontend-classes-with-invariants-uncle-bob-approach.md)
- [DEC-027](./DEC-027-store-holds-viewmodels-not-entities-or-dtos.md)
- [DEC-028](./DEC-028-state-management-with-zustand-and-tanstack-query-adapter-on-fe.md)
- [DEC-029](./DEC-029-mappers-on-every-boundary-fe-identically-as-be.md)
- [DEC-033](./DEC-033-form-validation-via-domain-entities-fowler-pattern.md)

## Source provenance

- Original source: legacy decision log
- Pre-atomization path: `docs/history/decision-log.md`
- Original identifier: `DEC-057`
- Original order: 58 of 59
- Original source lines: 1112–1167
- Frozen source commit: `582b3e8b147293c7b33dd0f839839aa81d7c8c20`
