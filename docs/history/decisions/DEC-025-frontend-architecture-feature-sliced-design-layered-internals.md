# DEC-025 — Frontend Architecture — Feature-Sliced Design + Layered Internals

## Source status

Historical decision recorded on 2026-06-25. The source provides an explicit decision statement. The source does not assign a separate lifecycle status to this record. Chronological presence does not prove current authority.

## Preserved decision record

**Date:** 2026-06-25

**Decision:** Frontend architecture based on Feature-Sliced Design (FSD) with a layered internal structure per feature (domain → application → infrastructure → ui). It aligns with the hexagonal architecture from the backend.

**Top-level structure:**
```
src/
  app/           ← Bootstrap, providers, routing, global layouts
  pages/         ← Route composites — orchestrate features per view
  features/      ← Self-contained business capabilities (import, categorization, analytics...)
  entities/      ← Shared domain objects (cross-feature: Transaction, ImportBatch, User)
  shared/        ← Zero business logic — design system, HTTP client, generic hooks, utilities
```

**Internal structure per feature:**
```
features/{name}/
  domain/          ← Entity classes, value objects, ports (interfaces), validators
  application/     ← Use-case hooks, store (via facade), mappers (entity↔VM, DTO↔entity)
  infrastructure/  ← Zustand implementation, TanStack Query implementation, API services, adapters (papaparse)
  ui/              ← React components (rendering only), ViewModels
  index.ts         ← Public API — encapsulation (internal structure does not leak out)
```

**Dependency rule:**
```
pages → features → entities → shared
(within a feature:)  ui → application → domain
                              ↓
                        infrastructure → domain
```

**Rationale:**
- The application will be large: admin panel, user panel, charts, multiple data grids, advanced flows
- Feature-flat (components/hooks/store in one folder) does not scale with 30+ files per feature
- Layered internals per feature provide consistency with the backend — the same mental model (ports, mappers, entity behavior)
- FSD top-level (app/pages/features/entities/shared) provides a readable import hierarchy and prevents circular dependencies
- `index.ts` as a public API per feature = encapsulation, internal refactoring does not leak out

**Rules:**
- `features/` do not import from each other (independence)
- `pages/` compose `features/` (page = layout + wiring, zero logic)
- `entities/` are shared domain (cross-feature types with behavior)
- `shared/` is infrastructure without business logic

## Source provenance

- Original source: legacy decision log
- Pre-atomization path: `docs/history/decision-log.md`
- Original identifier: `DEC-025`
- Original order: 25 of 59
- Original source lines: 361–406
- Frozen source commit: `582b3e8b147293c7b33dd0f839839aa81d7c8c20`
