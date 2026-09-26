# Tier 1 — Security Fixes + Dashboard Real Data

## Context

This work addressed three critical gaps found during feature verification:
1. Categories module: GET/PUT/DELETE have no workspace isolation (cross-tenant leak)
2. Transactions module: GET/:id, PUT/:id, DELETE/:id have no workspace isolation
3. Dashboard displays 100% hardcoded mock data disconnected from real stores

**Architecture:** Backend is hexagonal (NestJS). Frontend is FSD (Feature-Sliced Design) with local-first Zustand stores.

---

## ~~Bullet 1: Fix Categories workspace isolation~~ ✅ DONE

**Completed 2026-08-20.** Workspace-scoped GET/PUT/DELETE. Dead `findAll()` removed from port. Ownership check pattern: `!existing || existing.workspaceId !== workspaceId` → NotFoundException.

---
## ~~Bullet 2: Fix Transactions workspace isolation~~ ✅ DONE

**Completed 2026-08-20.** Workspace-scoped GET/:id, PUT/:id, DELETE/:id. Dead `findAll()` removed from port. Dead `GetTransactionsHandler` deleted. Cross-workspace category assignment validated in CreateTransactionHandler, UpdateTransactionHandler, CreateRuleHandler, UpdateRuleHandler, ImportTransactionsHandler.

---

## Bullet 3: Dashboard — KPI widget from real data

**Scope:** `client/src/features/dashboard-widgets/api/useKpiQuery/`

### Problem
Returns hardcoded mock KPI (balance 12 450 zł, income 8 500 zł, etc.)

### Changes

Replace mock with computed data from `useTransactionsStore`.

File: `client/src/features/dashboard-widgets/api/useKpiQuery/useKpiQuery.ts`

```typescript
import { useTransactionsStore } from '#features/transactions';
import { formatAmount } from '#shared/lib';
import type { KpiDto } from '#features/dashboard-widgets/model/types';

interface KpiQueryResult {
  readonly data: KpiDto[];
  readonly isLoading: boolean;
}

export const useKpiQuery = (): KpiQueryResult => {
  const transactions = useTransactionsStore((s) => s.transactions);

  // Compute from real transactions (current month)
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

  const currentMonth = transactions.filter(
    (tx) => tx.date >= monthStart && tx.date <= monthEnd,
  );

  const income = currentMonth
    .filter((tx) => tx.amount > 0)
    .reduce((sum, tx) => sum + tx.amount, 0);
  const expenses = Math.abs(
    currentMonth
      .filter((tx) => tx.amount < 0)
      .reduce((sum, tx) => sum + tx.amount, 0),
  );
  const balance = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  const savings = income - expenses;

  const data: KpiDto[] = [
    { id: 'balance', label: 'Saldo', value: formatAmount(balance) },
    { id: 'income', label: 'Przychody', value: formatAmount(income) },
    { id: 'expenses', label: 'Wydatki', value: formatAmount(expenses) },
    { id: 'savings', label: 'Savings', value: formatAmount(savings) },
  ];

  return { data, isLoading: false };
};
```

Note: `deltaPercent` and `trend` require previous month comparison — implement as derived (compare current vs previous month). If no transactions, show "0,00 zł" and no delta.

### Gate
- `tsc --noEmit` clean in client/
- Dashboard displays computed values (sum of real transactions)
- When no transactions → all zeros
- When transactions imported → values match

---

## Bullet 4: Dashboard — Trend chart from real data

**Scope:** `client/src/features/dashboard-widgets/api/useTrendQuery/`

### Problem
Returns hardcoded 6-month series (Sty-Cze).

### Changes

Compute last 6 months income/expense aggregation from `useTransactionsStore`.

File: `client/src/features/dashboard-widgets/api/useTrendQuery/useTrendQuery.ts`

```typescript
import { useTransactionsStore } from '#features/transactions';
import type { ChartSeries } from '#shared/adapters/charts';

interface TrendQueryResult {
  readonly data: ChartSeries[];
  readonly isLoading: boolean;
}

export const useTrendQuery = (): TrendQueryResult => {
  const transactions = useTransactionsStore((s) => s.transactions);

  // Aggregate last 6 months
  const now = new Date();
  const months: Array<{ label: string; start: string; end: string }> = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    months.push({
      label: d.toLocaleString('pl-PL', { month: 'short' }).replace('.', ''),
      start: d.toISOString().slice(0, 10),
      end: end.toISOString().slice(0, 10),
    });
  }

  const incomeSeries = months.map((m) => ({
    x: m.label,
    y: transactions
      .filter((tx) => tx.date >= m.start && tx.date <= m.end && tx.amount > 0)
      .reduce((sum, tx) => sum + tx.amount, 0),
  }));

  const expenseSeries = months.map((m) => ({
    x: m.label,
    y: Math.abs(
      transactions
        .filter((tx) => tx.date >= m.start && tx.date <= m.end && tx.amount < 0)
        .reduce((sum, tx) => sum + tx.amount, 0),
    ),
  }));

  const data: ChartSeries[] = [
    { id: 'Przychody', data: incomeSeries },
    { id: 'Wydatki', data: expenseSeries },
  ];

  return { data, isLoading: false };
};
```

### Gate
- `tsc --noEmit` clean
- Chart renders from real data (months with 0 show flat line)

---

## Bullet 5: Dashboard — Budget progress from real data

**Scope:** `client/src/features/dashboard-widgets/api/useBudgetQuery/`

### Problem
Returns hardcoded 6 budget items.

### Changes

Read from `useBudgetsStore` + compute spent from `useTransactionsStore`.

File: `client/src/features/dashboard-widgets/api/useBudgetQuery/useBudgetQuery.ts`

```typescript
import { useBudgetsStore } from '#features/budgets';
import { useTransactionsStore } from '#features/transactions';
import type { BudgetDto } from '#features/dashboard-widgets/model/types';

interface BudgetQueryResult {
  readonly data: BudgetDto[];
  readonly isLoading: boolean;
}

export const useBudgetQuery = (): BudgetQueryResult => {
  const budgets = useBudgetsStore((s) => s.budgets);
  const transactions = useTransactionsStore((s) => s.transactions);

  const data: BudgetDto[] = budgets
    .filter((b) => !b.isArchived && b.budgetType === 'standard')
    .map((budget) => {
      const assigned = transactions.filter((tx) => tx.budgetId === budget.id);
      const spent = Math.abs(
        assigned
          .filter((tx) => tx.amount < 0)
          .reduce((sum, tx) => sum + tx.amount, 0),
      );
      return {
        label: budget.name,
        spent,
        limit: budget.limitAmount,
        color: budget.color,
      };
    });

  return { data, isLoading: false };
};
```

### Gate
- `tsc --noEmit` clean
- Widget shows real budgets with computed spent amounts
- Empty state when no budgets

---

## Bullet 6: Dashboard — Recent transactions from real data

**Scope:** `client/src/features/dashboard-widgets/api/useRecentTransactionsQuery/`

### Problem
Returns hardcoded 5 transactions.

### Changes

Read last 5 transactions (sorted by date desc) from `useTransactionsStore`.

File: `client/src/features/dashboard-widgets/api/useRecentTransactionsQuery/useRecentTransactionsQuery.ts`

```typescript
import { useTransactionsStore } from '#features/transactions';
import { formatAmount } from '#shared/lib';
import type { RecentTransactionDto } from '#features/dashboard-widgets/model/types';

interface RecentTransactionsQueryResult {
  readonly data: RecentTransactionDto[];
  readonly isLoading: boolean;
}

const RECENT_LIMIT = 5;

export const useRecentTransactionsQuery = (): RecentTransactionsQueryResult => {
  const transactions = useTransactionsStore((s) => s.transactions);

  const sorted = [...transactions].sort(
    (a, b) => b.date.localeCompare(a.date),
  );

  const data: RecentTransactionDto[] = sorted.slice(0, RECENT_LIMIT).map((tx) => {
    const parts = tx.description.split('\n');
    const merchant = parts[0] ?? tx.description;
    const direction: 'income' | 'expense' = tx.amount >= 0 ? 'income' : 'expense';
    const formatted = new Date(tx.date).toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'short',
    });

    return {
      id: tx.id,
      merchant,
      category: tx.categoryId ?? 'Bez kategorii',
      date: formatted,
      amount: formatAmount(tx.amount),
      direction,
    };
  });

  return { data, isLoading: false };
};
```

### Gate
- `tsc --noEmit` clean
- Widget shows last 5 imported transactions
- Empty when no transactions

---

## Bullet 7: Dashboard — Category breakdown + remaining widgets

**Scope:** `client/src/features/dashboard-widgets/api/useCategoryBreakdownQuery/`, `useSavingsRateQuery/`, `useRecurringExpensesQuery/`

### Changes

**7a. Category breakdown** — aggregate expenses per categoryId from transactions store. Map categoryId → label (from known categories or fallback "Bez kategorii").

**7b. Savings rate** — compute from current month: `rate = (income - expenses) / income * 100`. If income = 0, rate = 0.

**7c. Recurring expenses** — this is the hardest one. Two options:
- **Option A (pragmatic):** Keep mock data with a comment `// TODO: detect recurring from transaction patterns`. Recurring detection requires pattern matching over 3+ months of data.
- **Option B:** Detect transactions with same description + similar amount appearing in multiple months. Complex — defer to separate bullet.

**Recommendation:** Implement 7a + 7b from real data. Keep 7c as mock with `// TODO` annotation (recurring detection is a separate feature, not a security/correctness issue).

### Gate
- `tsc --noEmit` clean
- Category donut shows real breakdown (or empty if no transactions)
- Savings rate reflects actual data

---

## Bullet 8: Dashboard — empty states + formatAmount utility

**Scope:** `client/src/shared/lib/formatAmount/`, dashboard widget components

### Problem
When user has 0 transactions, dashboard should show meaningful empty states rather than broken charts with all zeros.

### Changes

**8a. Verify `formatAmount` utility exists and handles edge cases**

Check `shared/lib/formatAmount/` — must format: positive, negative (with − prefix), zero, with PLN suffix, with thousands separator.

**8b. Widget empty states**

Each widget that reads from store should handle empty state gracefully:
- KpiRow: show "0,00 zł" for all values (not broken)
- TrendChart: show a flat zero line or a "No data" message
- CategoryDonut: "No expenses to display"
- BudgetProgress: "No budgets" or hide the widget
- RecentTransactions: "No transactions"
- SavingsRate: show 0% or "No data"

**8c. Verify `features/transactions` exports what dashboard needs**

`features/transactions/index.ts` must export `useTransactionsStore`. Similarly `features/budgets/index.ts` must export `useBudgetsStore`.

### Gate
- tsc clean
- Dashboard with 0 transactions: no crashes, meaningful empty states
- Dashboard after CSV import: real numbers appear

---

## Dependency Order

```
[1] Categories workspace isolation     (BE) ✅ DONE
[2] Transactions workspace isolation   (BE) ✅ DONE
    ↓ (independent of 1-2, can start in parallel)
[3] KPI widget real data               (FE)
[4] Trend chart real data              (FE)
[5] Budget progress real data          (FE)
[6] Recent transactions real data      (FE)
[7] Category breakdown + savings rate  (FE)
[8] Empty states + utility check       (FE)
```

**Parallel tracks:**
- Track A (BE): Bullets 1 → 2 (sequential, same pattern)
- Track B (FE): Bullets 3 → 4 → 5 → 6 → 7 → 8 (sequential, each builds on shared approach)

Track A and Track B are **fully independent** — can be implemented in parallel.

---

## Acceptance Criteria

- [x] `GET /categories` returns ONLY workspace-scoped categories
- [x] `PUT /categories/:id` returns 404 for cross-workspace category
- [x] `DELETE /categories/:id` returns 404 for cross-workspace category
- [x] `GET /transactions/:id` returns 404 for cross-workspace transaction
- [x] `PUT /transactions/:id` returns 404 for cross-workspace transaction
- [x] `DELETE /transactions/:id` returns 404 for cross-workspace transaction
- [ ] Dashboard KPI shows computed values from imported transactions
- [ ] Dashboard trend chart aggregates last 6 months from real data
- [ ] Dashboard budget progress reads from budgets store
- [ ] Dashboard recent transactions shows last 5 real imported transactions
- [ ] Dashboard category breakdown aggregates from real expenses
- [ ] Dashboard with 0 transactions shows meaningful empty states (no crashes)
- [ ] `tsc --noEmit` clean (server + client)
- [ ] All tests pass (server + client)
- [ ] Zero cross-workspace data leak possible via API

---

## NEVER

1. NEVER return data from a different workspace — if entity exists but `workspaceId` doesn't match, throw `NotFoundException` (don't reveal existence)
2. NEVER leave mock data in production hooks — each rewritten hook must read from store
3. NEVER import from `features/transactions` or `features/budgets` directly into dashboard component files — only through `api/` hooks (dashboard hooks act as the bridge)
4. NEVER skip empty state handling — 0 transactions = graceful UI, not NaN or broken chart
5. NEVER add `useCallback`/`useMemo` prematurely — dashboard re-renders are cheap with small datasets
