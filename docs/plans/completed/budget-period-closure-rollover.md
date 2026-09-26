# Phase 4.6: Budget Period Closure & Surplus Rollover

## Context

Recurring budgets (monthly/yearly) require explicit closure by the user after the period ends. If surplus remains (remaining > 0), the user can roll it over to:
- The same budget (increases next period's limit)
- A savings budget (special accumulative type)

If the budget is at zero or overspent — it closes without rollover, and a new period opens with the default limit.

**Dependencies:** ADR-009 (budget entity), Phase 4.5 (budgets page — implemented)

---

## Key Concepts

### Period Lifecycle (new)

```
[ACTIVE] → period ends → [AWAITING_CLOSURE]
                                ↓
                    user closes (with optional rollover)
                                ↓
                        [CLOSED] + new period [ACTIVE]
```

States:
- **ACTIVE** — current period, transactions are counted
- **AWAITING_CLOSURE** — period has ended, user action required
- **CLOSED** — archived with history (spent, limit, surplus, rollover target)

### Budget types (extension)

| Type | Behavior | Limit | Period |
|---|---|---|---|
| `standard` (existing) | Recurring, requires closure after period | Fixed per period | monthly/yearly/custom |
| `savings` (new) | Accumulative, never auto-closes | No upper limit — optional goal | None (open-ended) |

### Rollover rules

- Available **ONLY when `remaining > 0`** (surplus exists)
- If `remaining <= 0` → budget closes automatically, new period opens with default limit
- If no savings budget exists → only options are rollover to next period or discard surplus
- User can split surplus between targets (future — v2)

### Savings budget

- `type: 'savings'`
- No `period` (open-ended, never closes)
- Accumulates amounts from rollovers
- Optional `goalAmount` — savings target (e.g., "Emergency fund: 10 000 PLN")
- UI: progress bar toward goal, inflow history (rollovers)
- Multiple savings budgets allowed (e.g., "Vacation", "Emergency", "Retirement")

---

## Data Model Changes

### BudgetRecord (extension)

```typescript
type BudgetType = 'standard' | 'savings';

type BudgetPeriodRecord =
  | { type: 'monthly' }
  | { type: 'yearly' }
  | { type: 'custom'; dateFrom: string; dateTo: string };

interface BudgetRecord {
  readonly id: string;
  readonly workspaceId: string;
  readonly budgetType: BudgetType;             // ← NEW
  readonly name: string;
  readonly color: string;
  readonly limitAmount: number;                // for savings: goalAmount (0 = no goal)
  readonly limitCurrency: string;
  readonly period: BudgetPeriodRecord | null;  // ← null for savings
  readonly categoryIds: readonly string[];
  readonly createdAt: string;
  readonly isArchived: boolean;
}
```

### PeriodHistory (new)

```typescript
interface PeriodHistoryRecord {
  readonly id: string;
  readonly budgetId: string;
  readonly periodFrom: string;        // ISO date
  readonly periodTo: string;          // ISO date
  readonly limitAmount: number;
  readonly spentAmount: number;
  readonly remainingAmount: number;
  readonly closedAt: string;          // ISO datetime
  readonly rollover: RolloverRecord | null;
}

interface RolloverRecord {
  readonly amount: number;
  readonly targetType: 'same_budget' | 'savings_budget';
  readonly targetBudgetId: string;    // self-id for same_budget, savings budget id otherwise
}
```

### Savings balance (derived / computed)

Savings budget balance = sum of all `RolloverRecord.amount` where `targetBudgetId === savingsBudgetId`.
No separate storage needed — computed from PeriodHistory.

---

## UI Behavior

### Budget card — period expired

When `now > periodTo` and the budget has not been closed:

```
┌─────────────────────────────────────┐
│ 🟡 Groceries             [Close]    │
│ 1–31 August · Period ended          │
│                                      │
│ SPENT            REMAINING           │
│ 1 800,00 PLN    700,00 PLN          │
│ ████████████░░░░░░  72%             │
│                                      │
│ ⚠️ Period closure required           │
│ [Close and roll over surplus]        │
└─────────────────────────────────────┘
```

### Closure modal

After clicking "Close":

```
┌─────────────────────────────────────────┐
│ Close period: Groceries                  │
│ August 2026                              │
│                                          │
│ Limit:       2 500,00 PLN               │
│ Spent:       1 800,00 PLN               │
│ Surplus:       700,00 PLN               │
│                                          │
│ What to do with the surplus?             │
│                                          │
│ ○ Carry forward to next period (Sep)     │
│   → September limit: 2500 + 700 = 3200  │
│                                          │
│ ○ Transfer to savings                    │
│   → [▾ Select savings budget]           │
│                                          │
│ ○ Discard surplus (do not carry over)    │
│                                          │
│              [Cancel]  [Close period]    │
└─────────────────────────────────────────┘
```

When `remaining <= 0`:
- Simplified modal: "Period ended. Budget was overspent / fully used."
- No rollover options
- Button: "Close and open new period"

### Savings budget card

```
┌─────────────────────────────────────┐
│ 💰 Emergency Fund                    │
│ Savings budget                       │
│                                      │
│ ACCUMULATED        GOAL              │
│ 4 200,00 PLN    10 000,00 PLN       │
│ ████████████░░░░░░░░░░  42%        │
│                                      │
│ Last inflow: +700 PLN (Groceries)    │
│ [View inflow history]                │
└─────────────────────────────────────┘
```

---

## Implementation Bullets

### Bullet 0: ADR-010 — Period Closure & Rollover Design

**Scope:** `docs/adr/010-budget-period-closure-rollover.md`

Formal decision covering:
- Period lifecycle (ACTIVE → AWAITING_CLOSURE → CLOSED)
- Savings budget type (accumulative, no period)
- Rollover rules (surplus only)
- PeriodHistory as audit trail
- Data model changes

**Gate:** ADR written and accepted.

---

### Bullet 1: Domain — Savings budget type + period lifecycle

**Scope:** `packages/domain/src/budget/`

- Extend Budget entity with `budgetType: 'standard' | 'savings'`
- Savings budget: `period = null`, `goalAmount` instead of `limitAmount`
- Period lifecycle enum/methods on entity
- `Budget.canClose(now): boolean` — true when `now > periodEnd`
- `Budget.canRollover(): boolean` — true when remaining > 0
- `Budget.close(rollover?): ClosedPeriod` — closes and returns history record
- Invariant tests

---

### Bullet 2: Model — PeriodHistory types + store

**Scope:** `features/budgets/model/` + `features/budgets/store/`

- `PeriodHistoryRecord` type
- `RolloverRecord` type
- `usePeriodHistoryStore` — Zustand persist, localStorage key `budget-period-history`
- Actions: `closePeriod(record)`, `getHistory(budgetId)`

---

### Bullet 3: Model — Period status computation

**Scope:** `features/budgets/model/`

- Extend `BudgetStatus` with new state: `'awaitingClosure'`
- Update `computeBudgetStatus()` — if `now > periodEnd` and not closed → `'awaitingClosure'`
- `computeSavingsBalance(budgetId, periodHistory): number` — sum of rollovers
- Tests

---

### Bullet 4: Store — Budget closure + rollover actions

**Scope:** `features/budgets/store/useBudgetsStore`

- `closeBudgetPeriod(budgetId, rolloverOption)`:
  1. Saves PeriodHistory record
  2. If rollover to same budget → creates new period with `limit + surplus`
  3. If rollover to savings → adds to savings balance (via PeriodHistory)
  4. If discard → creates new period with default limit
  5. Updates budget record (new period start/end)
- `createSavingsBudget(props)` — create savings budget

---

### Bullet 5: UI — Closure banner on budget card

**Scope:** `features/budgets/ui/BudgetCard/`

- When status = `'awaitingClosure'`:
  - Badge: "Requires closure" (amber/yellow)
  - Banner on card: "Period ended · Closure required"
  - Button: "Close period" (triggers modal)
- When remaining <= 0: simplified flow (auto-close without rollover options)

---

### Bullet 6: UI — Period Closure Modal

**Scope:** `features/budgets/ui/PeriodClosureModal/`

- Period summary (limit, spent, remaining)
- Radio options: "Carry forward to next period" / "Transfer to savings" / "Discard"
- Dropdown: savings budget selection (if savings option chosen)
- Disabled savings option if user has no savings budget (with hint: "Create a savings budget first")
- Hook: `usePeriodClosure(budgetId)`
- Submit → store action → closure + open new period

---

### Bullet 7: UI — Savings budget card variant

**Scope:** `features/budgets/ui/BudgetCard/` or new `SavingsBudgetCard/`

- Different layout than standard: ACCUMULATED + GOAL (instead of SPENT + REMAINING)
- Progress bar toward goal (if goalAmount > 0)
- Last inflow (rollover) info
- No "Close period" (savings never closes)
- "View inflow history" option (list of rollovers with date and source)

---

### Bullet 8: UI — Create Savings Budget (CRUD extension)

**Scope:** `features/budgets/ui/BudgetFormModal/`

- Extend form with budget type selector (Standard / Savings)
- When savings: no period selector, "Limit" → "Goal (optional)"
- Validation: savings does not require period

---

### Bullet 9: Page integration + translations

**Scope:** `pages/BudgetsPage.tsx` + `pl.json`

- Savings budgets in grid (separate section? or mixed with others?)
- Filter: savings do not appear under "Month"/"Year" (no period)
- New i18n keys: closure modal, savings card, status labels
- Empty state for savings: "You don't have a savings budget yet"

---

## Dependency Order

```
[0] ADR-010
    ↓
[1] Domain: savings type + period lifecycle
    ↓
[2] Model: PeriodHistory types + store
[3] Model: Period status computation
    ↓
[4] Store: closure + rollover actions
    ↓
[5] UI: Closure banner on card
[6] UI: Period Closure Modal
[7] UI: Savings budget card
    ↓
[8] UI: Create Savings Budget (CRUD)
[9] Page integration + translations
```

---

## Out of Scope (future)

- Split surplus between multiple targets (part savings, part next period) — v2
- Auto-close after X days without user action — v2
- Notifications for pending closures — depends on notification system
- Automatic savings assignment from import — v2
- Savings withdrawal (taking money out of savings) — v2
- Multiple rollover beneficiaries from single closure — v2

---

## Acceptance Criteria

- [ ] ADR-010 written and accepted
- [ ] Savings budget type: no period, accumulative, optional goal
- [ ] After period ends: budget card shows "Requires closure"
- [ ] Closure modal: summary + rollover options (same/savings/discard)
- [ ] Rollover to same budget: next period has increased limit
- [ ] Rollover to savings: amount added to savings balance
- [ ] No savings budget: option disabled with info "Create a savings budget first"
- [ ] remaining <= 0: no rollover options, simple close + open next
- [ ] PeriodHistory: audit trail of closed periods
- [ ] Savings card: accumulated, goal, progress, inflow history
- [ ] All strings via i18n
- [ ] tsc clean, tests pass
- [ ] Zero API calls — local-first
