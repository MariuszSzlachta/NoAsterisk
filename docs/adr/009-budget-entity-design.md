# ADR-009: Budget Entity — Design & Transaction Assignment

**Date:** 2026-08-12
**Status:** Accepted
**Context:** BudgetFlow needs budget management to let users set spending limits per category/purpose and track progress. All data is client-side only (local-first — see ADR-003). Budgets are user configuration, not PII, but still stored locally because the app follows a zero-server-data architecture for user content.

---

## Problem

Current model has no budget concept. This means:
1. Cannot set spending limits per category/purpose
2. Cannot track "how much have I spent of my limit this month?"
3. Cannot warn user when approaching/exceeding budget
4. Dashboard budget widget uses hardcoded mock data
5. `BudgetsPage` is a placeholder

User's target view (from mockup):
- Grid of budget cards with progress bars, status badges, remaining amounts
- KPI summary row (total planned, spent, remaining, warnings count)
- Transaction assignment to budgets
- Period-based tracking (monthly/yearly/custom)

---

## Decisions

### D1: Budget is a separate entity, NOT an extension of Category

A budget is NOT "a category with a limit". Key reasoning:

- One budget can cover **multiple categories** (e.g., "Household" budget covers Groceries + Bills + Cleaning)
- One budget can cover **no specific category** (e.g., "Miscellaneous" budget for uncategorized or random expenses)
- Same category can appear in different budgets (e.g., "Food" category transactions split between "Daily Meals" and "Entertainment Dining" budgets)
- A transaction's assignment to a budget is **independent** of its category

Budget has `categoryIds: string[]` as a **hint** for auto-suggest during assignment — not as a hard constraint. The source of truth for "which transaction belongs to which budget" is `budgetId` on the transaction.

### D2: `budgetId` on Transaction — single budget assignment

```typescript
Transaction { ..., budgetId?: string }
```

- A transaction can be assigned to **0 or 1** budgets (not many-to-many)
- `budgetId` is optional — unassigned transactions exist and are valid
- Assignment is manual (user decision) in v1
- Future: auto-assignment hints based on `budget.categoryIds` matching `transaction.categoryIds`

**Rationale:** Many-to-many (splitting one transaction across budgets) adds significant complexity (split amounts, UI for partial assignment). Single assignment covers 95% of use cases. Users who buy "Coca-Cola for home" vs "Coca-Cola for party" make that decision at assignment time.

### D3: Budget entity — domain model

```typescript
class Budget {
  constructor(
    readonly id: string,
    readonly workspaceId: string,
    readonly name: string,           // "Grocery shopping", "Vacation 2026"
    readonly color: string,          // CSS color value for UI (e.g., "var(--cat-groceries)" or "#34d399")
    readonly limitAmount: number,    // budget cap for the period
    readonly limitCurrency: string,  // "PLN", "EUR"
    readonly period: BudgetPeriod,   // monthly | yearly | custom
    readonly categoryIds: string[],  // hint categories for auto-suggest (NOT a constraint)
    readonly createdAt: Date,
    readonly isArchived: boolean,
  )
}

type BudgetPeriod =
  | { type: 'monthly' }                              // auto: 1st to last day of current month
  | { type: 'yearly' }                               // auto: Jan 1 to Dec 31
  | { type: 'custom'; dateFrom: Date; dateTo: Date } // user-defined fixed range
```

**Period semantics:**
- `monthly` — automatically rolls to current month. "Spent" is computed from transactions in the current calendar month.
- `yearly` — automatically rolls to current year.
- `custom` — fixed date range (e.g., "Vacation 2026" = Jul 1 to Aug 31). Does NOT auto-roll.

### D4: Budget status — always derived, never stored

Status is computed at display time from `(spent, limit, daysElapsed, totalDays)`:

| Status | Condition | UI Badge |
|--------|-----------|----------|
| `overBudget` | spent > limit | "Over budget" (red) |
| `warning` | spent/limit > daysElapsed/totalDays AND spent > 0.7 * limit | "Warning" (amber) |
| `onTrack` | default — within normal range | "On track" (green) |
| `surplus` | spent < 0.5 * limit AND daysElapsed > 0.5 * totalDays | "Surplus" (green) |
| `newPeriod` | totalTransactions === 0 in current period | "New period" (blue) |

**Rationale:** Derived status = no stale data. Budget status updates automatically as transactions are added/removed. Pure function, easily testable.

### D5: Category extended with `color` (local-only)

Category entity in `packages/domain/` gets new optional fields:

```typescript
Category { ..., color?: string, icon?: string }
```

These are **local-only** user customizations. Backend's category model remains unchanged (system categories may have defaults, but user overrides live client-side).

The `color` field is used for:
- Budget card progress bar color (budget inherits color from its primary category, or user picks custom)
- Category tag rendering in transaction lists
- Dashboard category breakdown chart colors

### D6: Transaction assignment — manual first, auto-suggest later

**V1 (this implementation):**
- User manually assigns transactions to budgets via "+ Assign transaction" button on budget card
- Bulk assign available (select multiple unassigned transactions → assign to budget)
- Unassign available (remove budgetId from transaction)

**V2 (future enhancement, NOT in this phase):**
- Auto-suggest: when importing new transactions, if `transaction.categoryIds` overlap with `budget.categoryIds`, system suggests assignment
- Auto-assign rules: user can opt-in to "auto-assign all Groceries to budget X"
- Import step: budget assignment step after categorization

### D7: Persistence — encrypted IndexedDB via the Session 02 repository boundary

Same privacy boundary as accounts and transactions (ADR-005, ADR-006):
- Zustand stores only hydrated `BudgetRecord[]` while the vault is unlocked.
- `budget-budgets` is a legacy migration source only.
- Durable records are encrypted with AES-256-GCM before being written to the
  versioned Dexie database.

### D8: Budget does NOT live on backend

Backend has **no budget module**. Reasons:
- All user financial data is local-first (ADR-003)
- Budget configuration is user content — same privacy guarantees as transactions
- Future: encrypted blob sync (backend stores ciphertext, knows nothing about budgets)

---

## Data Model

### Budget (new entity)

```typescript
interface BudgetRecord {
  readonly id: string;
  readonly workspaceId: string;
  readonly name: string;
  readonly color: string;
  readonly limitAmount: number;
  readonly limitCurrency: string;
  readonly period: BudgetPeriodRecord;
  readonly categoryIds: readonly string[];
  readonly createdAt: string;         // ISO 8601
  readonly isArchived: boolean;
}

type BudgetPeriodRecord =
  | { type: 'monthly' }
  | { type: 'yearly' }
  | { type: 'custom'; dateFrom: string; dateTo: string }  // ISO dates
```

### Transaction (extended)

```typescript
interface StoredTransaction {
  // ... existing fields ...
  readonly budgetId?: string;         // ← NEW: assigned budget (0 or 1)
}
```

### Category (extended)

```typescript
interface CategoryRecord {
  readonly id: string;
  readonly workspaceId: string;
  readonly name: string;
  readonly color?: string;            // ← NEW: user-defined color
  readonly icon?: string;             // ← NEW: user-defined icon
  readonly createdAt: string;
}
```

---

## FSD Structure

```
features/budgets/
  model/
    types.ts                          ← BudgetViewModel, BudgetKpiVM, BudgetStatus
    budget-status.ts                  ← computeBudgetStatus() — pure function
    budget-status.spec.ts
    budget-kpi.ts                     ← computeBudgetKpis() — aggregate stats
    transformers.ts                   ← BudgetRecord + transactions → BudgetViewModel
    transformers.spec.ts
  store/
    useBudgetsStore/
      useBudgetsStore.ts              ← Zustand: budgets CRUD
      index.ts
  ui/
    BudgetCard/                       ← Single budget card (rich component)
    BudgetKpiRow/                     ← 4 KPI cards at top
    BudgetFilters/                    ← FilterTabs + period selector
    BudgetGrid/                       ← Responsive grid of budget cards
    BudgetFormModal/                  ← Create/edit budget
    AssignTransactionModal/           ← Assign transactions to budget
    hooks/
      useBudgetCard/
      useBudgetKpi/
      useBudgetFilters/
      useBudgetGrid/
      useBudgetForm/
      useAssignTransaction/
  index.ts                            ← Public API
```

---

## Integration Points

### 1. Transactions Feature

- `useTransactionsStore` needs: `assignBudget(transactionId, budgetId)`, `removeBudget(transactionId)`
- Transaction list/grid may show budget badge column (future)
- Transaction detail may show "Budget: X" info

### 2. Dashboard

- `useBudgetQuery` mock → replace with real computed data from `useBudgetsStore` + `useTransactionsStore`
- `BudgetProgressWidget` on dashboard → aggregated view (top 5 budgets by % spent)

### 3. CSV Import (future — NOT this phase)

- After import completes, soft prompt: "Assign transactions to budgets?"
- Or: automatic suggestion based on budget.categoryIds matching imported transaction categories

---

## What This Does NOT Cover

- Split transactions across multiple budgets (partial amounts) — not in scope, single assignment only
- Recurring/scheduled budgets (e.g., auto-create new monthly budget) — period auto-rolls, no new entity needed
- Budget templates ("create same budgets every month") — future enhancement
- Budget sharing between workspace members — depends on E2EE multi-user sync
- Auto-assignment rules engine — V2, separate ADR if needed
- Import step for budget assignment — V2, depends on import wizard extension
- Backend budget module — not needed (local-first)
- Budget notifications/alerts — post-MVP (see deferred backlog)

---

## Risks

| Risk | Mitigation |
|------|-----------|
| User forgets to assign transactions → budget shows 0 spent | Status "New period" + soft nudge: "X transactions without budget" |
| Too many budgets → overwhelming UI | Archive inactive budgets, show "Need attention" filter |
| Period boundary confusion (transaction date vs budget period) | Clear period display on card: "Jun 1-30 · 6 days remaining" |
| budgetId orphaned (budget deleted but transactions still reference it) | On delete: clear budgetId from all assigned transactions (cascade) |
| Custom period budgets never "reset" | Intentional — user creates new budget for next period |

---

## Verification Checklist (post-implementation)

After implementation, verify that:
- [ ] Budget entity in `packages/domain/` has proper invariants and tests
- [ ] Transaction.budgetId is optional, properly propagated in all entity methods
- [ ] Status computation matches the table above (unit tests cover all 5 statuses)
- [ ] Period `getCurrentRange(now)` works correctly for monthly/yearly/custom
- [ ] No budget data sent to backend (local-only persistence)
- [ ] Deleting a budget cascades: clears budgetId on assigned transactions
- [ ] Category.color is used consistently across budget cards, dashboard, transaction list

If implementation deviates from this ADR, create a **new ADR (ADR-010+)** documenting what changed and why. Reference this ADR as superseded/amended.
