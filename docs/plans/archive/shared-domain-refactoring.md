# Dev Plan: Architecture Refactoring

> **Archived plan:** Preserved as execution history. Its original `NEXT` status is historical; the roadmap and Phase 1 review record later progress. Verify current code before acting on unchecked items.

**Status:** NEXT — blocks all new features
**Date:** 2026-07-06

---

## Context

Architecture session on 2026-07-06 revealed fundamental decisions:
- The app is going local-first with E2EE (ADR-003) — backend = auth + encrypted blobs
- The domain must live in a shared package `packages/domain/` (ADR-006) — DDD classes, transferable to BE in the future
- Existing FE code (csv-import) requires structural refactoring (ADR-007) — flat dump → per-step grouping, naming convention, extensible registries
- Account entity (ADR-005) is the first new feature after refactoring

## Work Order

```
1. ✅ packages/domain/ scaffold + move existing domain from BE  [ADR-006] — 91115c9
2. Refactor csv-import/model/ — structure, names, registries       [ADR-007]
3. Account integration in csv-import (profile ↔ account linkage)    [ADR-005]
4. Step 3 Anonymization UI                                          [existing plan]
5. Manual transaction entry                                         [future]
```

---

## Phase 2: CSV Import Refactoring [ADR-007]

**Rule:** Each bullet = separate commit. Logic does NOT change — only move/rename/regroup. Tests MUST pass after each bullet.

### Bullet 2.1 — Split `types.ts` into per-group types

Split `model/types.ts` (~200 lines) into per-group types:
- `model/parsing/types.ts` — parser types (RawRow, ParsedCsvResult, ParserConfig, etc.)
- `model/column-mapping/types.ts` — ColumnMapping, DomainField, BankProfile, MappingProfile
- `model/transformation/types.ts` — TransactionRow, RowStatus, DuplicateInfo
- `model/anonymization/types.ts` — AnonymizationEntry, DetectionSpan, PiiType (if not already in anonymizer/)
- `model/submission/types.ts` — ImportRowPayload, ImportChunkPayload, ImportProgress

Remove old `types.ts`. Fix imports in all consumers. Tests green.

### Bullet 2.2 — Move `parser/` → `model/parsing/`

- `parser/csv-parser.ts` → `parsing/csv-parser/csv.parser.ts` + `index.ts`
- `parser/encoding-detector.ts` → `parsing/encoding-detector/encoding.detector.ts` + `index.ts`
- `parser/separator-detector.ts` → `parsing/separator-detector/separator.detector.ts` + `index.ts`
- `parser/date-parser.ts` → `parsing/date-parser/date.parser.ts` + `index.ts`
- `parser/amount-parser.ts` → `parsing/amount-parser/amount.parser.ts` + `index.ts`
- `parser/data-boundary-detector.ts` → `parsing/data-boundary-detector/data-boundary.detector.ts` + `index.ts`
- `parser/strategies/` → `parsing/strategies/` (rename files: `direct-strategy.ts` → `direct.strategy.ts`, etc.)
- Spec files move with their source. Fix imports. Tests green.

### Bullet 2.3 — Move loose files → `model/column-mapping/`

- `column-mapper.ts` → `column-mapping/column-mapper/column.mapper.ts` + `index.ts`
- `bank-detector.ts` → `column-mapping/bank-profiles/bank-profile.registry.ts` + `index.ts`
- Extract `HEADER_HEURISTICS` from column-mapper → `column-mapping/heuristics/header-heuristic.registry.ts`
- Spec files move with source. Tests green.

### Bullet 2.4 — Move loose files → `model/transformation/`

- `row-transformer.ts` → `transformation/row-transformer/row.transformer.ts` + `index.ts`
- `duplicate-detector.ts` → `transformation/duplicate-detector/duplicate.detector.ts` + `index.ts`
- `find-similar-rows.ts` → `transformation/find-similar-rows/find-similar-rows.ts` + `index.ts`
- Spec files move with source. Tests green.

### Bullet 2.5 — Move `anonymizer/` → `model/anonymization/`

- `anonymizer/pipeline.ts` → `anonymization/pipeline/anonymization.pipeline.ts` + `index.ts`
- `anonymizer/masker.ts` → `anonymization/masker/masker.ts` + `index.ts`
- `anonymizer/conflict-resolver.ts` → `anonymization/conflict-resolver/conflict.resolver.ts` + `index.ts`
- `anonymizer/constants.ts` → `anonymization/constants.ts`
- `anonymizer/detectors/*.ts` → `anonymization/detectors/` (rename: `phone-detector.ts` → `phone.detector.ts` etc.)
- `anonymizer/dictionaries/` → `anonymization/dictionaries/` (as-is, already good)
- Spec files move with source. Tests green.

### Bullet 2.6 — Move `import-chunks.ts` → `model/submission/`

- `import-chunks.ts` → `submission/import-chunks/import-chunks.ts` + `index.ts`
- Spec file moves with source. Tests green.

### Bullet 2.7 — Move E2E/integration tests + cleanup

- `__tests__/csv-e2e-parseCsvFile.spec.ts` → `parsing/csv-parser/csv-parser.e2e.spec.ts`
- `__tests__/csv-stubs-integration.spec.ts` → `parsing/csv-parser/csv-stubs.integration.spec.ts`
- Remove empty `__tests__/` folder.
- Add `model/index.ts` barrel with public API feature.
- Final: run ALL tests, ensure zero regression.

### Bullet 2.8 — Registry pattern: header heuristics + bank profiles

- `column-mapping/heuristics/header-heuristic.registry.ts` — class `HeaderHeuristicRegistry` with `register()` + `match()`
- `column-mapping/bank-profiles/bank-profile.registry.ts` — class `BankProfileRegistry` with `register()` + `detect()`
- `column-mapping/column-mapper/column.mapper.ts` — accepts registry as a parameter (DI via argument)
- Tests: registries + column mapper with injected registry. Tests green.

---

## Decisions Made (ADR's)

| ADR | Title | Status |
|-----|-------|--------|
| 003 | Local-First E2EE Architecture | Planned (confirmed as direction) |
| 005 | Account Entity Design | Accepted |
| 006 | Shared Domain Package (DDD in monorepo) | Accepted |
| 007 | CSV Import Code Quality Refactoring | Accepted |

## Established Rules

- **Domain = DDD classes** in `packages/domain/` (zero deps, pure TS)
- **Store = plain records** (immer-compatible), mapper on the boundary (toDomain/toRecord)
- **Naming**: `*.entity.ts`, `*.mapper.ts`, `*.detector.ts`, `*.registry.ts` etc.
- **Heuristics/bank profiles = extensible registry** (not inline hardcode)
- **Folder-per-file** everywhere, grouping per-step in csv-import
- **Current backend = prototype** — domain will move to `packages/domain/`

## Blockers

- ❌ No new feature work starts until steps 1 and 2 are complete.
- ❌ Step 3 anonymization UI waits for Account integration and the refactor.
