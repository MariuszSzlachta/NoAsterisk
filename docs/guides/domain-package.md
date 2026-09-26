# Domain Package — Developer Guide

## Overview

`packages/domain/` is a **shared pure-TypeScript package** containing DDD entities, value objects, and domain logic. It has zero framework dependencies and is consumed by the backend and shared tooling.

**Package:** `@budget/domain` (private, workspace protocol)
**Related decisions:** [ADR-006](../adr/006-shared-domain-package.md) (shared domain package), [ADR-009](../adr/009-budget-entity-design.md) (budget entity design)

---

## Package Structure

```
packages/domain/
  package.json            ← @budget/domain, zero runtime deps
  tsconfig.json           ← strict mode, composite, bundler resolution
  vitest.config.ts        ← subpath alias resolution for tests
  src/
    index.ts              ← Public barrel (all exports)
    shared/
      domain-error.ts     ← DomainError class
      identifier.ts       ← generateId() (crypto.randomUUID)
    budget/
      budget.entity.ts
      budget.entity.spec.ts
      budget-period.vo.ts
      budget-period.vo.spec.ts
    transaction/
      transaction.entity.ts
      transaction.entity.spec.ts
      transaction-type.guard.ts
      money.vo.ts
      content-hash.ts
      money.vo.spec.ts
    category/
      category.entity.ts
      category.entity.spec.ts
    account/
      account.entity.ts
      account.entity.spec.ts
    categorization-rule/
      categorization-rule.entity.ts
      categorization-rule.entity.spec.ts
      matcher-type.enum.ts
      matchers.ts
      matchers.spec.ts
```

## Subpath Aliases

Internal imports use `#domain/*` subpath aliases defined in both `package.json` (Node resolution) and `tsconfig.json` (TypeScript resolution):

```typescript
import { DomainError } from '#domain/shared/domain-error';
import { Budget } from '#domain/budget/budget.entity';
import { Money } from '#domain/transaction/money.vo';
```

Available aliases: `#domain/shared/*`, `#domain/transaction/*`, `#domain/account/*`, `#domain/categorization-rule/*`, `#domain/category/*`, `#domain/budget/*`.

---

## Entities

### Budget

**File:** `src/budget/budget.entity.ts`
**Decision:** [ADR-009](../adr/009-budget-entity-design.md) (D1, D3)

Budget is a separate entity (not a Category extension). One budget can cover multiple categories or none. Assignment of transactions to budgets is independent of categorization.

#### Constructor fields

| Field | Type | Invariant |
|---|---|---|
| `id` | `string` | Non-empty |
| `workspaceId` | `string` | Non-empty |
| `name` | `string` | Non-empty after trim, max 100 chars |
| `color` | `string` | Non-empty after trim |
| `limitAmount` | `number` | Non-negative (zero allowed) |
| `limitCurrency` | `string` | Exactly 3 characters |
| `period` | `BudgetPeriod` | Valid discriminated union (custom: dateFrom < dateTo) |
| `categoryIds` | `readonly string[]` | Hint categories for auto-suggest, not a constraint |
| `createdAt` | `Date` | — |
| `isArchived` | `boolean` | — |

#### Factory

```typescript
Budget.create({
  workspaceId: string;
  name: string;
  color: string;
  limitAmount: number;
  limitCurrency: string;
  period: BudgetPeriod;
  categoryIds?: readonly string[];  // defaults to []
}): Budget
```

Generates a new ID, trims name, uppercases currency, sets `createdAt` to now, `isArchived` to false.

#### Mutation methods (immutable — return new instance)

| Method | Parameters | Notes |
|---|---|---|
| `rename(name)` | `string` | Trims; validates non-empty and max length |
| `updateLimit(amount, currency)` | `number, string` | Uppercases currency; validates non-negative + 3-letter |
| `changePeriod(period)` | `BudgetPeriod` | Validates custom period date order |
| `changeColor(color)` | `string` | Validates non-empty |
| `updateCategoryIds(categoryIds)` | `readonly string[]` | Allows empty array |
| `archive()` | — | Returns same instance if already archived |
| `unarchive()` | — | Returns same instance if not archived |

---

### BudgetPeriod (Value Type)

**File:** `src/budget/budget-period.vo.ts`
**Decision:** [ADR-009](../adr/009-budget-entity-design.md) (D3)

Discriminated union type with pure utility functions:

```typescript
type BudgetPeriod =
  | { readonly type: 'monthly' }
  | { readonly type: 'yearly' }
  | { readonly type: 'custom'; readonly dateFrom: Date; readonly dateTo: Date };
```

**Period semantics:**
- `monthly` — auto-rolls to current month (1st to last day)
- `yearly` — auto-rolls to current year (Jan 1 to Dec 31)
- `custom` — fixed date range, does not auto-roll

#### Utility functions

| Function | Signature | Purpose |
|---|---|---|
| `validateBudgetPeriod` | `(period: BudgetPeriod) => void` | Throws if custom period has dateFrom ≥ dateTo |
| `getCurrentRange` | `(period, now: Date) => { from: Date; to: Date }` | Returns period boundaries relative to `now` |
| `getDaysRemaining` | `(period, now: Date) => number` | Days until period ends (0 if expired) |
| `getTotalDays` | `(period, now: Date) => number` | Total calendar days in the period |
| `getDaysElapsed` | `(period, now: Date) => number` | Full days since period started (0 if not started) |

---

### Transaction (extended)

**File:** `src/transaction/transaction.entity.ts`
**Decision:** [ADR-009](../adr/009-budget-entity-design.md) (D2)

Transaction now includes an optional `budgetId` field for single-budget assignment.

#### Budget-related additions

| Field / Method | Type / Signature | Notes |
|---|---|---|
| `budgetId` | `string \| undefined` (constructor) | Optional; if provided, must be non-empty |
| `assignBudget(budgetId)` | `(string) => Transaction` | Throws if empty string; no-op if same ID |
| `removeBudget()` | `() => Transaction` | No-op if already undefined |
| `hasBudget()` | `() => boolean` | Returns `budgetId !== undefined` |

**AP-8 compliance:** All existing mutation methods (`update`, `assignCategory`, `removeCategory`, `assignBudget`, `removeBudget`) propagate `budgetId` to the new instance.

**Invariant:** Constructor validates `budgetId !== undefined && !budgetId` (non-empty if provided).

---

### Category (extended)

**File:** `src/category/category.entity.ts`
**Decision:** [ADR-009](../adr/009-budget-entity-design.md) (D5)

Category now includes optional `color` and `icon` fields for user customization.

#### New fields and methods

| Field / Method | Type / Signature | Notes |
|---|---|---|
| `color` | `string \| undefined` (constructor) | If provided, must be non-empty |
| `icon` | `string \| undefined` (constructor) | If provided, must be non-empty |
| `changeColor(color)` | `(string \| undefined) => Category` | Allows clearing with `undefined` |
| `changeIcon(icon)` | `(string \| undefined) => Category` | Allows clearing with `undefined` |

**AP-8 compliance:** `rename()` propagates `color` and `icon` to the new instance.

---

## Exported Public API

All public types and functions are re-exported from `src/index.ts`:

```typescript
// Entities
export { Budget } from '#domain/budget/budget.entity';
export { Transaction, TransactionType } from '#domain/transaction/transaction.entity';
export { Category } from '#domain/category/category.entity';
export { Account } from '#domain/account/account.entity';
export { CategorizationRule } from '#domain/categorization-rule/categorization-rule.entity';

// Value Objects & Types
export type { BudgetPeriod } from '#domain/budget/budget-period.vo';
export { Money } from '#domain/transaction/money.vo';
export { MatcherType } from '#domain/categorization-rule/matcher-type.enum';

// Pure functions
export { validateBudgetPeriod, getCurrentRange, getDaysRemaining, getTotalDays, getDaysElapsed } from '#domain/budget/budget-period.vo';
export { isTransactionType } from '#domain/transaction/transaction-type.guard';
export { ContainsMatcher, ExactMatcher, MATCHERS } from '#domain/categorization-rule/matchers';

// Shared
export { DomainError } from '#domain/shared/domain-error';
export { generateId } from '#domain/shared/identifier';
```

Consumers import from the package name:

```typescript
import { Budget, Transaction, Category, DomainError } from '@budget/domain';
import type { BudgetPeriod } from '@budget/domain';
```

---

## Extension Guide

### Adding a new entity

1. Create `src/{entity-name}/` directory
2. Add `{entity-name}.entity.ts` with constructor invariants + `static create()` + mutation methods
3. Add `{entity-name}.entity.spec.ts` with tests covering happy path, boundary, and error cases
4. Add subpath alias to `package.json` `"imports"`, `tsconfig.json` `"paths"`, and `vitest.config.ts` `resolve.alias`
5. Export from `src/index.ts`

### Adding fields to an existing entity

1. Add field to constructor parameters
2. Add invariant validation in constructor body (if applicable)
3. Update `static create()` to accept the new field
4. **AP-8:** Update ALL mutation methods to propagate the new field to the new instance
5. Add tests for the invariant and propagation

### Adding a value object

1. Create `{vo-name}.vo.ts` in the relevant entity directory
2. Export the type and any pure utility functions
3. Add tests in `{vo-name}.vo.spec.ts`
4. Export from `src/index.ts`

---

## Design Rules

- **Zero dependencies** — no React, NestJS, Zustand, IndexedDB, or Node-only APIs.
- **Pure TypeScript** — compiles to ES modules, works in browser and Node.
- **Constructor always validates** — no invalid instance can exist (AP-3).
- **Immutable updates** — mutation methods return a new instance.
- **`create()`** generates identity — for new entities only. Constructor is for reconstitution.
- **No `async`** — domain is synchronous. IO is not domain's job.
- **Tests next to code** — `*.spec.ts` in same directory.
- **Status is derived, not stored** — budget status is computed at display time ([ADR-009 D4](../adr/009-budget-entity-design.md)).

---

## Tests

All domain tests are pure unit tests with zero mocks. Run with:

```bash
cd packages/domain && npx vitest run
```

Current test count (Phase 4.5 Bullets 1–3):

| File | Tests |
|---|---|
| `budget.entity.spec.ts` | 31 |
| `budget-period.vo.spec.ts` | 19 |
| `transaction.entity.spec.ts` | 46 |
| `category.entity.spec.ts` | 27 |
| `account.entity.spec.ts` | 22 |
| `categorization-rule.entity.spec.ts` | 16 |
| `matchers.spec.ts` | 12 |
| `money.vo.spec.ts` | 19 |
| **Total** | **192** |

---

## Related Documents

- [ADR-006: Shared Domain Package](../adr/006-shared-domain-package.md) — package creation rationale, persistence boundary, migration plan
- [ADR-009: Budget Entity Design](../adr/009-budget-entity-design.md) — decisions D1–D8, data model, FSD structure, integration points
- [Architecture Map](../architecture/README.md) — system-wide references
