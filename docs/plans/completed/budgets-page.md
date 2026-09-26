# Phase 4.5: Budgets Page (Local-First)

## Context

The "Budgets" page (BudgetsPage) — currently a placeholder. Mockup in [NoAsterisk.dc.html](../../design/mockups/NoAsterisk.dc.html).

**Architecture: local-first (ADR-003, ADR-006)**
Budget data lives locally (Zustand persist / IndexedDB). Backend does NOT store user data (aside from encrypted blobs in the future). Budget configuration = user data = local-first.

### Mockup shows:

1. **KPI row** (4 cards): Planned (11 300 zł) | Spent (4 740 zł) | Remaining (6 560 zł) | Need attention (2)
2. **FilterTabs**: All (6) | Need attention (2)
3. **Period selector**: Month | Year | Custom
4. **Budget cards grid** (3 columns) — each card:
   - Colored category dot + name + status badge (Over budget / Warning / On track / Surplus / New period)
   - Date range + "X days remaining"
   - SPENT amount + REMAINING amount (negative if over budget)
   - Progress bar (category color, red overflow)
   - Subtitle: progress info (e.g. "82% spent at 40% of time")
   - Footer: "+ Assign transaction" + "Details" dropdown
   - Expandable: ASSIGNED TRANSACTIONS (list with avatar + name + date + amount)

---

## Key decisions (for ADR-009)

**ADR-009: Budget Entity Design is required before implementation.**

### Decisions to make in the ADR:

1. **Budget ≠ Category** — a budget is a separate entity. One budget may cover multiple categories OR none (e.g., "Other", "Entertainment" with mixed purchases). A transaction is assigned to a budget via `budgetId` on the transaction.

2. **budgetId on Transaction** — `Transaction.entity.ts` requires a new field `budgetId?: string`. A transaction can be assigned to exactly 0 or 1 budget. Assignment is manual or automatic (rules? matching by category? — ADR should decide).

3. **Budget entity** in `packages/domain/src/budget/`:
   - `id`, `workspaceId`, `name`, `color`, `icon?`
   - `limit` (Money — limit amount per period)
   - `period` — period model: `monthly` (auto 1st–last day of month), `yearly`, `custom` (dateFrom, dateTo)
   - `categoryIds?: string[]` — optional suggested categories (for auto-assign hint, not a hard constraint)
   
4. **Status** — derived (computed from transactions), NOT stored:
   - `overBudget` (spent > limit)
   - `warning` (spent > 80% limit AND % of time < % spent)
   - `onTrack` (normal progress)
   - `surplus` (projected surplus — spent < 50% at > 50% of time)
   - `newPeriod` (0 transactions in the current period)

5. **Persistence** — Zustand + localStorage (MVP) / IndexedDB (future). User categories (UserCategory with color) are also local.

6. **Assigning transactions to a budget** — manual for now ("+ Assign transaction" button on card). Automatic assignment by categoryId = future enhancement (import step).

---

## Dependencies on existing code

### Requires changes:
- `packages/domain/src/transaction/transaction.entity.ts` — adding `budgetId?: string`
- `packages/domain/src/category/category.entity.ts` — adding `color: string`, `icon?: string`
- `client/src/features/transactions/model/types.ts` — `StoredTransaction` with `budgetId`
- `client/src/features/transactions/store/useTransactionsStore` — operations on budgetId

### To be created from scratch:
- `packages/domain/src/budget/budget.entity.ts`
- `features/budgets/` — entire feature

### Reusable from design system:
- `KpiCard` (shared/ui) — KPI row at the top
- `FilterTabs` (shared/ui) — "All / Need attention" tabs
- `Badge` (shared/ui) — status badges on cards
- `Card` (shared/ui) — base wrapper for budget cards
- `BudgetProgressList` (shared/ui) — **NOT reusable** — it's a simple list, budget cards are much richer. New component `BudgetCard`.

---

## Implementation bullets

### Bullet 0: ADR-009 — Budget Entity Design

**Scope:** `docs/adr/009-budget-entity-design.md`

Formal architectural decision describing:
- Budget as a separate entity (not a Category extension)
- `budgetId` on Transaction (optional, manual/auto assign)
- Budget model: name, color, limit, period (monthly/yearly/custom)
- Status computation: pure derived (from transactions in period)
- Local-first: budgets in Zustand persist, no backend
- Category extension with `color` (local-only, UserCategory)
- Auto-assign strategy (v1: manual, v2: hint by categoryIds)

**Gate:** ADR written, read, and accepted.

---

### Bullet 1: Domain — Budget entity in packages/domain

**Scope:** `packages/domain/src/budget/`

- `budget.entity.ts`:
  ```ts
  class Budget {
    constructor(
      id, workspaceId, name, color, 
      limitAmount, limitCurrency,
      period: BudgetPeriod,
      categoryIds: string[],  // hint categories (for auto-suggest, not hard constraint)
      createdAt, isArchived
    )
    static create(props): Budget
    rename(name): Budget
    updateLimit(amount, currency): Budget
    changePeriod(period): Budget
    archive(): Budget
  }
  
  type BudgetPeriod = 
    | { type: 'monthly' }
    | { type: 'yearly' }
    | { type: 'custom'; dateFrom: Date; dateTo: Date }
  ```
- `budget.entity.spec.ts` — invariant tests
- `budget-period.vo.ts` — value object with helper methods: `getCurrentRange(now): { from: Date; to: Date }`, `getDaysRemaining(now): number`
- Update `index.ts` barrel export

---

### Bullet 2: Domain — Transaction entity extension (budgetId)

**Scope:** `packages/domain/src/transaction/transaction.entity.ts`

- Add `budgetId?: string` to Transaction constructor
- Method `assignBudget(budgetId: string): Transaction`
- Method `removeBudget(): Transaction`
- Update `create()` and `update()` — propagate budgetId
- Update tests — new scenarios

---

### Bullet 3: Domain — UserCategory entity (local, with color)

**Scope:** `packages/domain/src/category/category.entity.ts` or new `user-category.entity.ts`

- Extend Category with `color: string` and `icon?: string`
- OR: separate UserCategory entity (if ADR decides on separation of system vs user categories)
- Tests

---

### Bullet 4: Feature model — types + budget status computation

**Scope:** `features/budgets/model/`

- `types.ts`:
  ```ts
  interface BudgetViewModel {
    id: string;
    name: string;
    color: string;
    status: BudgetStatus;
    statusLabel: string;
    periodLabel: string;        // "1-30 June"
    daysRemaining: number;
    spent: number;
    limit: number;
    remaining: number;          // limit - spent (negative if over)
    currency: string;
    progressPercent: number;    // 0-100+ (can be over 100)
    progressSubtitle: string;  // "82% spent at 40% of time"
    transactions: BudgetTransactionVM[];
  }
  
  type BudgetStatus = 'overBudget' | 'warning' | 'onTrack' | 'surplus' | 'newPeriod';
  ```
- `budget-status.ts` — pure function: `computeBudgetStatus(spent, limit, daysElapsed, totalDays): BudgetStatus`
- `budget-status.spec.ts` — all status scenarios
- `transformers.ts` — `mapBudgetRecordToViewModel(budget, transactions, now): BudgetViewModel`
- `transformers.spec.ts`
- `budget-kpi.ts` — `computeBudgetKpis(budgets: BudgetViewModel[]): BudgetKpiVM`

---

### Bullet 5: Feature store — Zustand budgets store

**Scope:** `features/budgets/store/`

- `useBudgetsStore.ts`:
  ```ts
  interface BudgetsState {
    budgets: BudgetRecord[];
    createBudget(props): void;
    updateBudget(id, props): void;
    archiveBudget(id): void;
    deleteBudget(id): void;
  }
  ```
- Zustand `persist` middleware → localStorage key `budget-budgets`
- BudgetRecord = plain serializable object (toRecord/toDomain pattern from ADR-006)

---

### Bullet 6: Feature UI — BudgetCard component

**Scope:** `features/budgets/ui/BudgetCard/`

- Single budget card component (per mockup):
  - Header: color dot + name + Badge (status)
  - Period info: date range + days remaining
  - Amounts row: SPENT (mono) + REMAINING (mono, red if negative)
  - Progress bar (color = budget color, overflow = red section)
  - Subtitle (progress info text)
  - Footer: "+ Assign transaction" button + "Details" dropdown (expand/collapse)
  - Expandable section: ASSIGNED TRANSACTIONS list
- Hook `useBudgetCard(budgetId)` — returns BudgetViewModel + handlers (expand, assign)

---

### Bullet 7: Feature UI — BudgetKpiRow + BudgetFilters

**Scope:** `features/budgets/ui/`

- `BudgetKpiRow/` — 4 KPI cards (Planned, Spent, Remaining, Need attention)
  - Reuse `KpiCard` from shared/ui
  - Hook `useBudgetKpi()` — compute from store
- `BudgetFilters/` — FilterTabs (All | Need attention) + Period selector (Month | Year | Custom)
  - Hook `useBudgetFilters()` — state: activeTab + selectedPeriod
  - Reuse `FilterTabs` from shared/ui
  - Period toggle (custom segmented control or FilterTabs)

---

### Bullet 8: Feature UI — BudgetGrid (cards layout)

**Scope:** `features/budgets/ui/BudgetGrid/`

- 3-column grid with BudgetCards
- Responsive: 3 col desktop, 2 col tablet, 1 col mobile
- Hook `useBudgetGrid()` — filters + period → filtered budgets → ViewModels
- Empty state: "No budgets. Create your first budget."

---

### Bullet 9: BudgetsPage composition + routing

**Scope:** `pages/BudgetsPage.tsx` + `features/budgets/index.ts`

- Replace placeholder:
  ```tsx
  <div className="flex flex-col gap-6 max-w-[1400px]">
    <BudgetKpiRow />
    <div className="flex items-center justify-between">
      <BudgetFilters />
    </div>
    <BudgetGrid />
  </div>
  ```
- `features/budgets/index.ts` — public API exports
- Empty state if 0 budgets
- "+ New budget" button somewhere (sidebar action? page header?)

---

### Bullet 10: Budget CRUD UI (Create/Edit modal)

**Scope:** `features/budgets/ui/BudgetFormModal/`

- Modal/drawer for creating/editing a budget:
  - Name input
  - Color picker (preset palette + custom)
  - Limit amount input (PLN)
  - Period selector (Month / Year / Custom with date pickers)
  - Category hints (optional multi-select from user categories)
- Hook `useBudgetForm()` — form state + validation + submit
- Connects to `useBudgetsStore.createBudget / updateBudget`

---

### Bullet 11: Assign transaction to budget

**Scope:** `features/budgets/ui/AssignTransactionModal/`

- Modal/popover triggered by "+ Assign transaction" on budget card
- Shows list of unassigned transactions (from the budget's current period)
- Filter/search by transaction description
- Multi-select → assign → updates `budgetId` on transactions in transactions store
- Hook `useAssignTransaction(budgetId)` — logic

---

## Dependencies (order)

```
[0] ADR-009 (architectural decisions)
    ↓
[1] Domain: Budget entity
[2] Domain: Transaction + budgetId
[3] Domain: Category + color
    ↓
[4] Model: types + status computation + transformers
[5] Store: Zustand budgets store
    ↓
[6] UI: BudgetCard
[7] UI: BudgetKpiRow + BudgetFilters
[8] UI: BudgetGrid
    ↓
[9] Page composition
    ↓
[10] Budget CRUD modal
[11] Assign transaction to budget
```

**Order:** 0 → 1,2,3 (parallel) → 4 → 5 → 6,7 (parallel) → 8 → 9 → 10 → 11

---

## ADR Compliance & Documentation Rule

**Implementation requirement:**

1. Before writing any code, read and understand ADR-009 (`docs/adr/009-budget-entity-design.md`).
2. After implementation is complete, verify that code matches ADR-009 decisions (D1–D8) using the Verification Checklist at the end of the ADR.
3. If during implementation a decision from ADR-009 needs to change (e.g., D2 single-assignment turns out insufficient), **DO NOT silently deviate**. Instead:
   - Stop implementation on the affected part
   - Write a new ADR (ADR-010+) documenting: what changed, why, and which ADR-009 decision is amended/superseded
   - Reference: `Amends: ADR-009, Decision D2`
   - Only then continue implementation with the new decision
4. Documentation phase must include ADR compliance check: "Does the implementation match ADR-009? List any deviations with their new ADR reference."

---

## Acceptance Criteria

- [ ] ADR-009 written and accepted
- [ ] Budget entity in packages/domain with invariants and tests
- [ ] Transaction entity extended with budgetId
- [ ] BudgetsPage renders grid with budgets from local store
- [ ] KPI row: Planned, Spent, Remaining, Need attention — computed from budgets
- [ ] FilterTabs: filtering by status (all / need attention)
- [ ] Period selector: Month / Year / Custom
- [ ] Budget cards: progress bar, status badge, amounts, period info
- [ ] Expandable transactions list on card
- [ ] Create/Edit budget modal (CRUD)
- [ ] Assign transaction to budget (manually from card)
- [ ] Empty state when 0 budgets
- [ ] Responsive grid (3/2/1 col)
- [ ] tsc --noEmit clean, tests pass (domain + model layer)
- [ ] Zero API calls — everything from local store

---

## Amendments

### 2026-08-17: "Custom" period filter shows DateRangePicker (overlap semantics)

**Problem:** The "Custom" period tab was filtering budgets by `period.type === 'custom'`, which is unintuitive. Users expect clicking "Custom" to let them pick a date range, not to filter by budget type.

**Decision:** When user selects the "Custom" period tab, a `DateRangePicker` appears. The grid then shows **all budgets whose period overlaps with the selected date range**, regardless of their `period.type`. This means:

- `monthly` budget for August → shown if user picks range overlapping August
- `yearly` budget for 2026 → shown if user picks any range within 2026
- `custom` budget Jun–Sep → shown if user picks range overlapping Jun–Sep

**Semantics per tab:**
- Month → `b.period.type === 'monthly'` (current month budgets)
- Year → `b.period.type === 'yearly'` (current year budgets)
- Custom → all non-archived budgets whose computed period range overlaps the user-selected date range

**Rationale:** More intuitive UX. "Custom" = "I choose what to see", not "show me custom-type budgets". Gives users a cross-cutting view across all budget types.
