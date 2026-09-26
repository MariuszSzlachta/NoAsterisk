# Budgets Feature — Developer Guide

> **Scope:** `client/src/features/budgets/` — budget management, period closure, surplus rollover, and savings budgets. All local-first (hydrated Zustand session + encrypted Dexie IndexedDB), zero API calls.

## Domain Context

Users set spending limits per purpose/category and track progress within time periods. When a period ends, users close it and decide what to do with any remaining surplus: carry it forward (increasing next period's limit), transfer it to a savings budget, or discard it.

Two budget types exist:
- **Standard** — recurring, period-based (monthly/yearly/custom), requires user closure when the period ends.
- **Savings** — accumulative, no period, collects rollovers from standard budgets toward an optional goal amount.

Related decisions: [ADR-009](../../adr/009-budget-entity-design.md) (budget entity design), [DEC-059](../../history/decisions/DEC-059-budget-overspend-ux-graduated-red-on-spent-amount.md) (overspend UX).

---

## Architecture & FSD Layers

```
features/budgets/
├── index.ts                              # Public API
├── model/
│   ├── types.ts                          # All types: BudgetRecord, ViewModels, Rollover, Closure
│   ├── budget-status.ts                  # computeBudgetStatus() — pure derived status
│   ├── budget-status.spec.ts
│   ├── budget-kpi.ts                     # computeBudgetKpis() — aggregate stats
│   ├── budget-kpi.spec.ts
│   ├── period-history.ts                 # PeriodHistoryRecord, computeSavingsBalance, getInflowHistory
│   ├── period-history.spec.ts
│   ├── transformers.ts                   # BudgetRecord → ViewModel mappers
│   ├── transformers.spec.ts
│   └── index.ts                          # Barrel
├── store/
│   ├── useBudgetsStore/                  # Budget CRUD + closeBudgetPeriod action
│   │   ├── useBudgetsStore.ts
│   │   ├── useBudgetsStore.spec.ts
│   │   └── index.ts
│   └── usePeriodHistoryStore/            # Persisted period closure audit trail
│       ├── usePeriodHistoryStore.ts
│       └── index.ts
└── ui/
    ├── BudgetCard/                       # Standard budget card with closure banner
    ├── BudgetKpiRow/                     # 4 KPI summary cards
    ├── BudgetFilters/                    # Status tabs + period selector
    ├── BudgetGrid/                       # Responsive grid of budget cards
    ├── BudgetFormModal/                  # Create/edit (Standard or Savings type toggle)
    ├── AssignTransactionModal/           # Assign transactions to budget
    ├── PeriodClosureModal/               # Closure flow with rollover options
    ├── SavingsBudgetCard/                # Savings variant (accumulated, goal, inflow history)
    └── hooks/
        ├── useBudgetCard/
        ├── useBudgetKpi/
        ├── useBudgetFilters/
        ├── useBudgetGrid/
        ├── useBudgetForm/
        ├── useAssignTransaction/
        ├── usePeriodClosure/             # Closure modal logic + store action dispatch
        └── useSavingsCard/              # Savings card ViewModel + inflow history
```

---

## Public API

```typescript
// features/budgets/index.ts — exported surface

// Components
export { BudgetCard } from './ui/BudgetCard';
export { BudgetKpiRow } from './ui/BudgetKpiRow';
export { BudgetFilters } from './ui/BudgetFilters';
export { BudgetGrid } from './ui/BudgetGrid';
export { BudgetFormModal } from './ui/BudgetFormModal';
export { AssignTransactionModal } from './ui/AssignTransactionModal';
export { PeriodClosureModal } from './ui/PeriodClosureModal';
export { SavingsBudgetCard } from './ui/SavingsBudgetCard';

// Hooks & Stores
export { useBudgetFilters } from './ui/hooks/useBudgetFilters';
export { useBudgetsStore } from './store/useBudgetsStore';
export { usePeriodHistoryStore } from './store/usePeriodHistoryStore';

// Transformers
export { mapBudgetRecordToViewModel } from './model/transformers';

// Types
export type {
  BudgetRecord, BudgetType, BudgetViewModel, SavingsBudgetViewModel,
  SavingsInflowEntry, BudgetKpiVM, BudgetStatus, BudgetFilterTab,
  BudgetPeriodFilter, RolloverOption, CloseBudgetPeriodParams,
} from './model/types';
export type { PeriodHistoryRecord, RolloverRecord, RolloverTargetType } from './model/period-history';
```

---

## Data Model

### BudgetRecord (hydrated in Zustand, encrypted IndexedDB collection `budgets`)

```typescript
type BudgetType = 'standard' | 'savings';

type BudgetPeriodRecord =
  | { type: 'monthly' }
  | { type: 'yearly' }
  | { type: 'custom'; dateFrom: string; dateTo: string };

interface BudgetRecord {
  readonly id: string;
  readonly workspaceId: string;
  readonly budgetType: BudgetType;
  readonly name: string;
  readonly color: string;
  readonly limitAmount: number;          // For savings: goalAmount (0 = no goal)
  readonly limitCurrency: string;
  readonly period: BudgetPeriodRecord | null;  // null for savings budgets
  readonly categoryIds: readonly string[];
  readonly createdAt: string;
  readonly isArchived: boolean;
}
```

### PeriodHistoryRecord (hydrated in Zustand, encrypted IndexedDB collection `period-history`)

```typescript
interface PeriodHistoryRecord {
  readonly id: string;
  readonly budgetId: string;
  readonly periodFrom: string;           // 'yyyy-MM-dd'
  readonly periodTo: string;
  readonly limitAmount: number;
  readonly spentAmount: number;
  readonly remainingAmount: number;
  readonly closedAt: string;             // ISO datetime
  readonly rollover: RolloverRecord | null;
}

interface RolloverRecord {
  readonly amount: number;
  readonly targetType: 'same_budget' | 'savings_budget';
  readonly targetBudgetId: string;
}
```

### BudgetStatus (always derived, never stored — ADR-009 D4)

```typescript
type BudgetStatus = 'awaitingClosure' | 'overBudget' | 'warning' | 'onTrack' | 'surplus' | 'newPeriod';
```

Priority order for computation: `awaitingClosure > newPeriod > overBudget > warning > surplus > onTrack`.

### Rollover / Closure types

```typescript
type RolloverOption =
  | { type: 'carry_forward' }
  | { type: 'savings'; targetBudgetId: string }
  | { type: 'discard' };

interface CloseBudgetPeriodParams {
  readonly budgetId: string;
  readonly spentAmount: number;
  readonly remainingAmount: number;
  readonly rolloverOption: RolloverOption;
  readonly periodFrom: string;
  readonly periodTo: string;
  readonly nextPeriod: BudgetPeriodRecord;
}
```

---

## Period Lifecycle

```
[ACTIVE] → now > periodEnd → [AWAITING_CLOSURE] → user closes → [CLOSED] + new [ACTIVE]
```

Key rules:
- **monthly/yearly** budgets auto-advance via `getPeriodRange(period, now)` — they reference the current calendar month/year and practically never reach `awaitingClosure` unless the user views the app after the period has passed and the history store has no record of that period being closed.
- **custom** budgets have fixed date ranges. When `now > dateTo`, the budget enters `awaitingClosure`.
- **savings** budgets have no period, never close, and never enter `awaitingClosure`.
- Detection: `computeBudgetStatus()` receives a `periodEnded` boolean. The transformer computes this by checking `now > to && !hasBeenClosed(budgetId, from, to, periodHistory)`.

---

## State Management

### useBudgetsStore (hydrated Zustand session + encrypted repository)

Actions:
- `createBudget(props)` — creates standard or savings budget
- `updateBudget(id, props)` — partial updates
- `archiveBudget(id)` — soft archive
- `deleteBudget(id)` — hard delete
- `closeBudgetPeriod(params: CloseBudgetPeriodParams)`:
  1. Builds a `PeriodHistoryRecord` with rollover info
  2. Persists it via `usePeriodHistoryStore.getState().addClosedPeriod()`
  3. If `carry_forward`: updates budget's `limitAmount` += remaining
  4. Updates budget's `period` to `params.nextPeriod`

### usePeriodHistoryStore (hydrated Zustand session + encrypted repository)

Simple append-only audit trail:
- `history: PeriodHistoryRecord[]`
- `addClosedPeriod(record)` — appends to history

---

## Transformers (pure functions in `model/`)

### `mapBudgetRecordToViewModel(budget, transactions, now, periodHistory?)`

Produces a `BudgetViewModel` for standard budgets:
- Computes period range via `getPeriodRange(period, now)`
- Filters assigned transactions within period
- Calculates spent (negated sum of negative amounts)
- Derives status via `computeBudgetStatus()`
- Checks `hasBeenClosed()` against period history to determine `periodEnded`
- Throws if called on a savings budget (`period === null`)

### `mapSavingsBudgetToViewModel(budget, periodHistory, allBudgets)`

Produces a `SavingsBudgetViewModel`:
- Accumulated balance = `computeSavingsBalance(budgetId, history)`
- Goal progress = `accumulated / goalAmount * 100` (capped at 100)
- Last inflow from `getLastInflow(budgetId, history, allBudgets)`

### `computeNextPeriod(currentPeriod)`

Preserves period type identity:
- `monthly` → `{ type: 'monthly' }` (auto-advances via `getPeriodRange`)
- `yearly` → `{ type: 'yearly' }`
- `custom` → next period starts day after current end, same duration

### Period history pure functions

- `computeSavingsBalance(savingsBudgetId, history)` — sum of rollovers targeting this savings budget
- `getInflowHistory(savingsBudgetId, history, allBudgets)` — all inflow entries, sorted newest-first
- `getLastInflow(savingsBudgetId, history, allBudgets)` — most recent inflow or null

---

## UI Components

### BudgetCard

Standard budget card with:
- Color dot, name, status badge
- Period label + days remaining (or "Period ended · Closure required")
- Spent / remaining amounts with progress bar
- **Closure banner** (amber, with AlertTriangle icon): displayed when `status === 'awaitingClosure'`, contains a "Close period" button that triggers `onClosePeriod(budgetId)` prop
- Expandable transaction list

### PeriodClosureModal

Opened from BudgetsPage when user clicks "Close period":
- Period summary: limit, spent, surplus/overspent
- **Rollover options** (only when remaining > 0):
  - Carry forward (shows computed new limit)
  - Transfer to savings (Select dropdown for target savings budget; disabled with hint if none exist)
  - Discard surplus
- When remaining ≤ 0: shows "no surplus" message, closes directly
- Submit dispatches `closeBudgetPeriod(params)` on the budgets store

### SavingsBudgetCard

Distinct savings variant:
- 💰 emoji + name
- Accumulated / goal amounts
- Progress bar toward goal (green `income` color)
- Last inflow info
- Expandable inflow history list (source budget name + date + amount)

### BudgetFormModal

Budget creation/edit form:
- **Budget type toggle** (Standard / Savings) — only shown when creating, not editing
- When savings: period selector hidden, "Limit" label becomes "Goal (optional)"
- When standard: full period selector (Monthly / Yearly / Custom with date pickers)
- Color palette picker, name input, amount input

---

## Page Integration (BudgetsPage)

```
BudgetsPage
├── BudgetKpiRow
├── BudgetFilters (status tabs + period selector)
├── BudgetGrid (standard budgets, passes onClosePeriod callback)
├── PeriodClosureModal (conditional, wired via closingBudgetId state)
├── Savings section
│   ├── Section heading + "Create savings budget" button
│   ├── SavingsBudgetCard × N (or empty state)
│   └── BudgetFormModal (with initialBudgetType="savings")
```

Cross-feature dependency: page imports `useTransactionsStore` to supply transactions for closure modal ViewModel computation. This is documented as an `ARCH-EXCEPTION` in the source.

---

## Extension Points

### Adding a new rollover option

1. Add variant to `RolloverOption` type in `model/types.ts`
2. Handle in `usePeriodClosure` hook (add radio option + state)
3. Handle in `useBudgetsStore.closeBudgetPeriod()` (build appropriate `RolloverRecord`)
4. Add i18n keys in `pl.json` under `budgets.closure`

### Connecting to backend (future E2EE sync)

The stores now write through the encrypted IndexedDB repositories (Session 02). Zero component changes are needed — stores abstract the persistence boundary.

### Adding auto-close after N days

Add a check in `computeBudgetStatus()` or the transformer that detects `daysSinceEnd > N` and triggers automatic closure with a default rollover option.

---

## i18n Keys (Polish)

All new keys live under `budgets.` namespace in `client/src/shared/i18n/locales/pl.json`:

- `budgets.status.awaitingClosure` — "Wymaga zamknięcia"
- `budgets.card.periodEnded` — "Okres zakończony · Wymagane zamknięcie"
- `budgets.card.closePeriod` / `budgets.card.closeAndReopen`
- `budgets.closure.*` — modal title, summary labels, option labels and hints
- `budgets.savings.*` — section title, card labels, inflow history, empty state
- `budgets.form.typeLabel` / `budgets.form.typeStandard` / `budgets.form.typeSavings`
- `budgets.form.goalLabel` / `budgets.form.goalPlaceholder`

---

## Tests

5 test files, all in `model/` and `store/`:

| File | Coverage |
|------|----------|
| `budget-status.spec.ts` | All 6 status states including `awaitingClosure` |
| `period-history.spec.ts` | `computeSavingsBalance`, `getInflowHistory`, `getLastInflow` |
| `transformers.spec.ts` | `mapBudgetRecordToViewModel`, `mapSavingsBudgetToViewModel`, `computeNextPeriod`, `hasBeenClosed` |
| `budget-kpi.spec.ts` | KPI aggregate computation |
| `useBudgetsStore.spec.ts` | `closeBudgetPeriod` action with all rollover types |

---

## Boundaries & Non-Goals

**Does:**
- Full period closure flow with rollover options
- Savings budget type with accumulation from rollovers
- Period history audit trail (persisted)
- Closure banner UX with amber warning

**Does NOT:**
- Split surplus between multiple targets — future v2
- Auto-close after timeout — future v2
- Savings withdrawal — future v2
- Backend persistence — local-first only (ADR-003)
- Budget notifications/alerts — post-MVP

---

## Known Tech Debt

| Item | Location | Notes |
|------|----------|-------|
| `useBudgetFilters` hook unused | `ui/hooks/useBudgetFilters/` | Page manages filter state directly |
| `doesPeriodOverlap` in hook instead of `model/` | `useBudgetGrid` | Should be a pure function in model |
| Handlers in page body | `BudgetsPage.tsx` | Should extract a `useBudgetsPageWiring` hook |
| Hardcoded Polish validation strings | `useBudgetForm` | Should use i18n keys |

---

*Generated: 2026-08-17 | Source: `client/src/features/budgets/`*
