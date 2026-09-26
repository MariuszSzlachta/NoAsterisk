# ADR-007: CSV Import — Code Quality Refactoring

**Date:** 2026-07-06
**Status:** Accepted
**Context:** Existing code in `features/csv-import/model/` is flat, unreadable, breaks encapsulation and open/closed principle. It was created in "AI generates quickly" mode without human review of the structure.
**Prerequisite for:** Further development of step 3, Account integration, any import extension.

---

## Problems

### 1. Flat structure — no encapsulation

```
model/
  column-mapper.ts         ← what does this belong to? step 1?
  row-transformer.ts       ← step 2?
  bank-detector.ts         ← step 0?
  duplicate-detector.ts    ← step 2?
  find-similar-rows.ts     ← batch edit?
  import-chunks.ts         ← step 4?
  types.ts                 ← 200 lines of ALL types in one file
```

14 loose files. A person opening this directory doesn't know what belongs to what, what the order is, or what depends on what.

### 2. Inline heuristics — open/closed violation

`column-mapper.ts` has `HEADER_HEURISTICS` hardcoded inline:

```typescript
const HEADER_HEURISTICS: Record<string, DomainField> = {
  'data operacji': 'date',
  'kwota': 'amount',
  ...
};
```

This should be:
- Data (heuristics) separated from logic (matching)
- Heuristics loaded from persisted storage (user adds new ones)
- Or at minimum: a separate file/module with a heuristics registry (extensible)

Same for `bank-detector.ts` — bank profiles hardcoded instead of being a registry.

### 3. God file: `types.ts`

~200 lines with EVERY type of the feature in one file:
- Parser types
- Anonymizer types
- Import submission types
- Wizard types
- Column mapping types

Zero grouping. Finding anything = scrolling.

### 4. Tests scattered

- Some: `file.spec.ts` next to the file ✅
- Others: `model/__tests__/csv-e2e-parseCsvFile.spec.ts` ← why a separate directory?
- No consistency.

### 5. No folder-per-file

Project convention states: every file in its own directory with `index.ts`. In `model/` this is not respected — loose files everywhere.

---

## Target structure

```
features/csv-import/
  model/
    parsing/                          ← Step 0: parse raw CSV
      csv-parser/
        csv-parser.ts
        csv-parser.spec.ts
        index.ts
      encoding-detector/
      separator-detector/
      date-parser/
      amount-parser/
      data-boundary-detector/
      strategies/                     ← row reassembly strategies
        direct-strategy.ts
        overflow-merge-strategy.ts
        anchor-strategy.ts
        resolve-strategy.ts
        patterns.ts
        index.ts
      types.ts                        ← ONLY parser types

    column-mapping/                   ← Step 1: map columns to domain fields
      column-mapper/
        column-mapper.ts              ← logic (matching algorithm)
        column-mapper.spec.ts
        index.ts
      heuristics/
        header-heuristics.ts          ← DATA: keyword → field mapping (extensible registry)
        header-heuristics.spec.ts
        index.ts
      bank-profiles/
        bank-profile-registry.ts      ← DATA: known bank signatures (extensible)
        bank-profile-registry.spec.ts
        index.ts
      types.ts                        ← ColumnMapping, DomainField, BankProfile, MappingProfile

    transformation/                   ← Step 2: raw rows → typed TransactionRows
      row-transformer/
        row-transformer.ts
        row-transformer.spec.ts
        index.ts
      duplicate-detector/
        duplicate-detector.ts
        duplicate-detector.spec.ts
        index.ts
      find-similar-rows/
        find-similar-rows.ts
        find-similar-rows.spec.ts
        index.ts
      types.ts                        ← TransactionRow, RowStatus

    anonymization/                    ← Step 3: PII detection + masking
      pipeline/
      masker/
      conflict-resolver/
      detectors/
      dictionaries/
      constants.ts
      types.ts                        ← AnonymizationEntry, DetectionSpan, PiiType

    submission/                       ← Step 4: chunk + submit
      import-chunks/
        import-chunks.ts
        import-chunks.spec.ts
        index.ts
      types.ts                        ← ImportRowPayload, ImportChunkPayload, ImportProgress

    index.ts                          ← barrel re-exports public API
```

### Principles:
- **Grouping per-step** — you open `parsing/` = you know it's step 0
- **Folder per file** — `csv-parser/csv-parser.ts` + `index.ts`
- **Types per-group** — `parsing/types.ts`, `anonymization/types.ts` — not one god file
- **Data separated from logic** — `heuristics/header-heuristics.ts` = registry (data), `column-mapper.ts` = algorithm (logic)
- **Tests next to code** — `file.spec.ts` in the same directory, always

---

## Heuristics — open/closed

### Current (closed — hardcoded):

```typescript
// column-mapper.ts
const HEADER_HEURISTICS: Record<string, DomainField> = { 'data operacji': 'date', ... };
export const autoDetectMapping = (headers) => { /* uses inline dict */ };
```

### Target (open — extensible registry):

```typescript
// heuristics/header-heuristics.ts
export interface HeaderHeuristic {
  readonly normalized: string;
  readonly field: DomainField;
  readonly source: 'builtin' | 'user';
}

// Built-in defaults
const BUILTIN_HEURISTICS: readonly HeaderHeuristic[] = [
  { normalized: 'data operacji', field: 'date', source: 'builtin' },
  { normalized: 'kwota', field: 'amount', source: 'builtin' },
  ...
];

// Registry pattern — extensible
export class HeaderHeuristicRegistry {
  private readonly entries: HeaderHeuristic[];

  constructor(builtins: readonly HeaderHeuristic[] = BUILTIN_HEURISTICS) {
    this.entries = [...builtins];
  }

  register(heuristic: HeaderHeuristic): void {
    this.entries.push(heuristic);
  }

  match(normalizedHeader: string): DomainField | undefined {
    return this.entries.find(h => h.normalized === normalizedHeader)?.field;
  }
}

// column-mapper.ts — receives registry, doesn't own data
export const autoDetectMapping = (
  headers: readonly string[],
  registry: HeaderHeuristicRegistry,
): ColumnMapping => { ... };
```

User adds new heuristics → persisted in IndexedDB → loaded into registry on boot. Zero changes in `column-mapper.ts`.

### Bank profiles — same pattern:

```typescript
// bank-profiles/bank-profile-registry.ts
export class BankProfileRegistry {
  private readonly profiles: BankProfile[];

  constructor(builtins: readonly BankProfile[] = BUILTIN_PROFILES) { ... }
  register(profile: BankProfile): void { ... }
  detect(headers: readonly string[]): BankProfile | undefined { ... }
}
```

---

## What is NOT subject to refactoring (already well organized)

- `anonymizer/detectors/` — each detector in a separate file, tests alongside ✅
- `parser/strategies/` — strategy pattern, separate files ✅
- `anonymizer/dictionaries/` — provider pattern ✅

These modules have good structure. They just need to be moved to `model/anonymization/` and `model/parsing/strategies/`.

---

## Scope

This is a **structural refactor** — moving files, changing imports, splitting god files. Logic does NOT change (except extracting heuristics to a registry). Tests must pass identically before and after.

---

## Order

1. First: `packages/domain/` scaffold (ADR-006)
2. Then: this refactor (moving files, grouping per-step)
3. Then: new features (step 3 UI, Account integration)

---

## File Naming Convention

File suffix communicates its role. Without it, you need to open the file to understand what it does.

| Role | Suffix | Example |
|------|--------|----------|
| Detector (detects something) | `*.detector.ts` | `encoding.detector.ts`, `iban.detector.ts` |
| Parser (parses data) | `*.parser.ts` | `date.parser.ts`, `amount.parser.ts`, `csv.parser.ts` |
| Mapper (A → B transformation) | `*.mapper.ts` | `column.mapper.ts`, `row.mapper.ts`, `account.mapper.ts` |
| Registry (extensible collection) | `*.registry.ts` | `header-heuristic.registry.ts`, `bank-profile.registry.ts` |
| Transformer (processes/enriches) | `*.transformer.ts` | `row.transformer.ts` |
| Strategy (algorithm variant) | `*.strategy.ts` | `overflow-merge.strategy.ts`, `direct.strategy.ts` |
| Pipeline (orchestrates steps) | `*.pipeline.ts` | `anonymization.pipeline.ts` |
| Resolver (resolves conflicts) | `*.resolver.ts` | `conflict.resolver.ts` |
| Provider (supplies data) | `*.provider.ts` | `dictionary.provider.ts` |
| Guard/Validator | `*.guard.ts` | `transaction-type.guard.ts` |
| Entity (domain) | `*.entity.ts` | `account.entity.ts`, `transaction.entity.ts` |
| Value Object (domain) | `*.vo.ts` | `money.vo.ts` |
| Test | `*.spec.ts` | `date.parser.spec.ts` |
| Types (interfaces/types only) | `types.ts` | `types.ts` (one per module) |
| Constants | `constants.ts` | `constants.ts` |
| Index (barrel) | `index.ts` | `index.ts` |

### Rules:

1. **Suffix ALWAYS present** — not `column-mapper.ts` but `column.mapper.ts`
2. **Separator = dot** — `encoding.detector.ts` not `encoding-detector.ts`
3. **Folder = name without suffix** — folder `encoding-detector/`, file inside `encoding.detector.ts`
4. **Spec next to code** — `encoding.detector.spec.ts` in the same folder

### Full example:

```
column-mapping/
  column-mapper/
    column.mapper.ts
    column.mapper.spec.ts
    index.ts
  heuristics/
    header-heuristic.registry.ts
    header-heuristic.registry.spec.ts
    index.ts
  bank-profiles/
    bank-profile.registry.ts
    bank-profile.registry.spec.ts
    index.ts
  types.ts
```

---

## Risks

| Risk | Mitigation |
|------|-----------|
| Many import changes = merge conflicts | Done on a separate branch, in one commit per-group |
| Tests break after moving | Run after each step, not at the end |
| Registry pattern = over-engineering? | No — user MUST be able to add heuristics. This is a core requirement, not speculation. |
