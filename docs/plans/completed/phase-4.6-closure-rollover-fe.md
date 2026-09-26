# Phase 4.6: Budget Period Closure & Rollover — FE Dev Plan

## Context

Parent plan: `docs/plans/active/budget-period-closure-rollover.md`

This phase extends the existing `features/budgets/` feature with:
- Budget type: `savings` (accumulative, no period)
- Period lifecycle: ACTIVE → AWAITING_CLOSURE → CLOSED
- Period closure modal with rollover options
- PeriodHistory as audit trail for closed periods
- Savings budget card variant

**Architecture:** local-first (Zustand persist, zero API calls). All changes within `features/budgets/`.

---

## Dependencies on existing code

### Files to modify:
- `features/budgets/model/types.ts` — new types (BudgetType, PeriodHistory, BudgetRecord extension)
- `features/budgets/model/budget-status.ts` — new status `awaitingClosure`
- `features/budgets/model/transformers.ts` — savings support (null period)
- `features/budgets/store/useBudgetsStore/useBudgetsStore.ts` — savings CRUD, closure action
- `features/budgets/ui/BudgetCard/BudgetCard.tsx` — closure banner, savings variant
- `features/budgets/ui/BudgetFormModal/BudgetFormModal.tsx` — type selector
- `features/budgets/ui/hooks/useBudgetForm/useBudgetForm.ts` — savings mode
- `features/budgets/ui/hooks/useBudgetGrid/useBudgetGrid.ts` — savings filtering
- `features/budgets/index.ts` — new exports
- `pages/BudgetsPage.tsx` — savings section
- `shared/i18n/locales/pl.json` — new keys

### To create from scratch:
- `features/budgets/model/period-history.ts` — types + helpers
- `features/budgets/store/usePeriodHistoryStore/` — Zustand store
- `features/budgets/ui/PeriodClosureModal/` — closure modal
- `features/budgets/ui/SavingsBudgetCard/` — savings card variant
- `features/budgets/ui/hooks/usePeriodClosure/` — closure logic hook
- `features/budgets/ui/hooks/useSavingsCard/` — savings card hook

### Reusable from design system:
- `Badge` — status "Awaiting closure" (amber)
- `Card` — card wrapper
- `Progress` — savings goal progress bar
- `Select` — savings budget dropdown in modal
- `Button` — actions
- `KpiCard` — KPI (unchanged)

---

## Implementation Bullets

### Bullet 1: Model — Extend types with BudgetType + PeriodHistory

**Scope:** `features/budgets/model/types.ts` + new `features/budgets/model/period-history.ts`

Changes in `types.ts`:
- `BudgetType = 'standard' | 'savings'`
- `BudgetRecord.budgetType: BudgetType` (default `'standard'`)
- `BudgetRecord.period: BudgetPeriodRecord | null` (null = savings)
- `BudgetStatus` — add `'awaitingClosure'`
- `BudgetPeriodFilter` — add `'savings'`
- New `SavingsBudgetViewModel`:
  ```ts
  interface SavingsBudgetViewModel {
    readonly id: string;
    readonly name: string;
    readonly color: string;
    readonly accumulated: number;
    readonly goalAmount: number;  // 0 = no goal
    readonly currency: string;
    readonly progressPercent: number;  // 0-100, only if goalAmount > 0
    readonly lastInflow: { amount: number; sourceBudgetName: string; date: string } | null;
  }
  ```

New `period-history.ts`:
- `RolloverTargetType = 'same_budget' | 'savings_budget'`
- `RolloverRecord`: amount, targetType, targetBudgetId
- `PeriodHistoryRecord`: id, budgetId, periodFrom, periodTo, limitAmount, spentAmount, remainingAmount, closedAt, rollover (null | RolloverRecord)
- Pure function `computeSavingsBalance(budgetId, history): number`
- Pure function `getLastInflow(budgetId, history, budgets): { amount, sourceBudgetName, date } | null`

**Gate:** `tsc --noEmit` clean. Tests for computeSavingsBalance and getLastInflow pass.

---

### Bullet 2: Model — Period status computation (awaitingClosure)

**Scope:** `features/budgets/model/budget-status.ts` + `budget-status.spec.ts`

- Extend `computeBudgetStatus()`:
  - New optional parameter: `periodEnded: boolean`
  - If `periodEnded === true` → return `'awaitingClosure'`
  - Priority: `awaitingClosure > newPeriod > overBudget > warning > surplus > onTrack`
- Add label key: `awaitingClosure: 'budgets.status.awaitingClosure'`
- New tests: scenarios with `periodEnded = true`

**Gate:** Existing tests + new ones pass. `tsc --noEmit` clean.

---

### Bullet 3: Model — Transformers (savings + awaitingClosure)

**Scope:** `features/budgets/model/transformers.ts` + `transformers.spec.ts`

- `mapBudgetRecordToViewModel()` — handle `period === null`:
  - If budget is savings → **do not map** to BudgetViewModel (savings has its own type)
  - Guard at entry: assert `budget.period !== null`
- New transformer `mapSavingsBudgetToViewModel(budget, periodHistory, allBudgets, now): SavingsBudgetViewModel`
- `getPeriodRange()` — guard: throw if period is null (savings must not reach it)
- Add `periodEnded` param to `mapBudgetRecordToViewModel` — compute: `now > periodTo && !closedInHistory`
- Tests: savings mapper, awaitingClosure scenario

**Gate:** All transformer tests pass. `tsc --noEmit` clean.

---

### Bullet 4: Store — PeriodHistory store + Budgets store extensions

**Scope:** `features/budgets/store/usePeriodHistoryStore/` (new) + modify `useBudgetsStore`

`usePeriodHistoryStore`:
- Zustand persist, key `budget-period-history`
- State: `history: PeriodHistoryRecord[]`
- Actions:
  - `addClosedPeriod(record: PeriodHistoryRecord): void`
  - `getHistoryForBudget(budgetId: string): PeriodHistoryRecord[]`

`useBudgetsStore` extensions:
- `createBudget` — accept `budgetType` + `period: null` for savings
- `CreateBudgetProps` — extend with `budgetType: BudgetType`
- New action `closeBudgetPeriod(budgetId, rolloverOption)`:
  1. Get budget from state
  2. Build PeriodHistoryRecord (with limitAmount, spentAmount from transformers)
  3. If rollover `'same_budget'` → create new period with `limit + surplus`
  4. If rollover `'savings_budget'` → add to history with targetBudgetId
  5. If rollover `'discard'` → new period with default limit
  6. Update `budget.period` (new dateFrom/dateTo)
  7. Call `usePeriodHistoryStore.getState().addClosedPeriod(record)`

**Gate:** `tsc --noEmit` clean. Store actions testable indirectly through UI hooks.

---

### Bullet 5: UI — Closure banner on BudgetCard

**Scope:** `features/budgets/ui/BudgetCard/BudgetCard.tsx` + hook update

Changes in `BudgetCard`:
- When `status === 'awaitingClosure'`:
  - Amber Badge: "Awaiting closure" (i18n key)
  - Banner below progress: "Period ended · Closure required"
  - Button: "Close period" → opens PeriodClosureModal
- Hook `useBudgetCard` — add `handleClosePeriod`, `isClosureModalOpen`, `openClosureModal`, `closeClosureModal`
- When `remaining <= 0` — simplified: "Close and open new period" (no rollover options)

**Gate:** Component renders correctly with new status. `tsc --noEmit` clean.

---

### Bullet 6: UI — PeriodClosureModal

**Scope:** `features/budgets/ui/PeriodClosureModal/PeriodClosureModal.tsx` + `features/budgets/ui/hooks/usePeriodClosure/`

Modal contains:
- Header: "Close period: {budgetName}" + month/year
- Summary: Limit | Spent | Surplus (monospace amounts)
- Radio options (when remaining > 0):
  - "Carry forward to next period" — show computed new limit
  - "Transfer to savings" — dropdown with savings budgets (disabled if none exist)
  - "Discard surplus"
- When remaining <= 0: no options, message "Budget was fully used / overspent"
- Buttons: "Cancel" + "Close period"

Hook `usePeriodClosure(budgetId)`:
- Get budget VM (limit, spent, remaining)
- State: `selectedOption: 'carry_forward' | 'savings' | 'discard'`
- State: `selectedSavingsBudgetId: string | null`
- `savingsBudgets` — list from store (budgetType === 'savings')
- `handleSubmit()` → store.closeBudgetPeriod(budgetId, rolloverOption) → close modal
- Validation: if savings selected but no target → disable submit

**Gate:** Modal renders. Hook logic correct. `tsc --noEmit` clean.

---

### Bullet 7: UI — SavingsBudgetCard

**Scope:** `features/budgets/ui/SavingsBudgetCard/SavingsBudgetCard.tsx` + `features/budgets/ui/hooks/useSavingsCard/`

Savings card component:
- Header: 💰 + name (no status badge — savings has no statuses)
- Subtitle: "Savings budget"
- Amounts row: ACCUMULATED (mono) + GOAL (mono, only if goalAmount > 0)
- Progress bar (toward goal, green) — visible only when goalAmount > 0
- Last inflow: "+700 PLN (Groceries)" with date
- No "Close period", no "Assign transaction"
- Button "Inflow history" (expandable list of rollovers)

Hook `useSavingsCard(budgetId)`:
- Get budget from store
- Call `computeSavingsBalance(budgetId, periodHistory)`
- Call `getLastInflow(budgetId, periodHistory, allBudgets)`
- Return `SavingsBudgetViewModel` + `inflowHistory: { amount, source, date }[]`

**Gate:** Component renders correctly. `tsc --noEmit` clean.

---

### Bullet 8: UI — Create Savings Budget (form extension)

**Scope:** `features/budgets/ui/BudgetFormModal/BudgetFormModal.tsx` + `features/budgets/ui/hooks/useBudgetForm/useBudgetForm.ts`

Form extensions:
- New segment at top: "Budget type" → radio/toggle: "Standard" | "Savings"
- When type = `savings`:
  - Hide "Period" (period selector)
  - "Limit" → "Savings goal (optional)"
  - Placeholder: "e.g. 10000"
  - Goal = 0 means no goal
- When type = `standard`: form unchanged (default behavior)

Hook `useBudgetForm` extensions:
- `budgetType` in form state
- `setBudgetType` handler
- Conditional validation: savings does not require period
- On submit: `createBudget({ ...props, budgetType, period: budgetType === 'savings' ? null : period })`

**Gate:** Form correctly toggles modes. Saving a savings budget creates record with `budgetType: 'savings'` and `period: null`. `tsc --noEmit` clean.

---

### Bullet 9: Page integration + translations

**Scope:** `pages/BudgetsPage.tsx` + `shared/i18n/locales/pl.json` + `features/budgets/ui/BudgetGrid/BudgetGrid.tsx` + `features/budgets/ui/hooks/useBudgetGrid/useBudgetGrid.ts`

Changes in BudgetGrid/useBudgetGrid:
- Filtering: savings budgets do NOT appear in the main grid (standard budgets only)
- Savings have a separate section below the grid

Changes in BudgetsPage:
- Below `<BudgetGrid />` add "Savings budgets" section:
  - Heading + list of `SavingsBudgetCard`
  - Empty state: "You don't have a savings budget yet."
  - Button: "+ Create savings budget" → opens BudgetFormModal with type=savings

New i18n keys (`budgets.*`):
```json
"closure": {
  "title": "Zamknij okres: {{name}}",
  "periodLabel": "{{month}} {{year}}",
  "limit": "Limit",
  "spent": "Wydano",
  "surplus": "Surplus",
  "overspent": "Przekroczenie",
  "noSurplus": "The budget has been fully used. There is no surplus to carry forward.",
  "optionCarryForward": "Carry forward to the next period",
  "optionCarryForwardHint": "Limit: {{currentLimit}} + {{surplus}} = {{newLimit}}",
  "optionSavings": "Move to savings",
  "optionSavingsSelect": "Select a savings budget",
  "optionSavingsEmpty": "Create a savings budget first",
  "optionDiscard": "Discard surplus",
  "cancel": "Anuluj",
  "submit": "Zamknij okres"
},
"savings": {
  "title": "Savings budgets",
  "subtitle": "Savings budget",
  "accumulated": "ZGROMADZONO",
  "goal": "CEL",
  "noGoal": "Bez celu",
  "lastInflow": "Last inflow: +{{amount}} ({{source}})",
  "inflowHistory": "Inflow history",
  "empty": "You do not have a savings budget yet.",
  "create": "Create a savings budget",
  "progressLabel": "{{percent}}% celu"
},
"form": {
  "typeLabel": "Budget type",
  "typeStandard": "Standardowy",
  "typeSavings": "Savings",
  "goalLabel": "Savings goal (optional)",
  "goalPlaceholder": "np. 10000"
},
"status": {
  "awaitingClosure": "Requires closure"
},
"card": {
  "periodEnded": "Period ended · Closure required",
  "closePeriod": "Zamknij okres",
  "closeAndReopen": "Close and open a new period"
}
```

**Gate:** Page renders savings section. Filtering correct. i18n keys complete. `tsc --noEmit` clean. No hardcoded strings.

---

## Dependency Order

```
[1] Model: types + PeriodHistory          ← foundation, everything depends on this
    ↓
[2] Model: budget-status (awaitingClosure) ← depends on new BudgetStatus type
[3] Model: transformers (savings + period) ← depends on [1] and [2]
    ↓
[4] Store: PeriodHistory + Budgets ext     ← depends on [1], [3]
    ↓
[5] UI: Closure banner on card             ← depends on [2], [4]
[6] UI: PeriodClosureModal                 ← depends on [4], [5]
[7] UI: SavingsBudgetCard                  ← depends on [1], [3], [4]
    ↓
[8] UI: Create Savings Budget (form)       ← depends on [4]
[9] Page integration + translations        ← depends on [5], [6], [7], [8]
```

---

## Bullet Tracker

| # | Scope | Layer | Status |
|---|---|---|---|
| 1 | Model: types + PeriodHistory | model/ | ⬜ |
| 2 | Model: budget-status (awaitingClosure) | model/ | ⬜ |
| 3 | Model: transformers (savings + period) | model/ | ⬜ |
| 4 | Store: PeriodHistory + Budgets extensions | store/ | ⬜ |
| 5 | UI: Closure banner on BudgetCard | ui/ | ⬜ |
| 6 | UI: PeriodClosureModal | ui/ | ⬜ |
| 7 | UI: SavingsBudgetCard | ui/ | ⬜ |
| 8 | UI: Create Savings Budget (form ext) | ui/ | ⬜ |
| 9 | Page integration + translations | pages/ + i18n | ⬜ |

---

## Out of scope

- ADR-010 (bullet 0 from parent plan — separate task)
- Backend domain entity changes (separate backend change)
- Split surplus between targets — v2
- Auto-close, notifications — v2
- Savings withdrawal — v2
