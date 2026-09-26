# Dashboard Widgets Feature — Developer Guide

## Domain Context

Users want a single-page overview of their financial health: how much they earn, spend, save, and where money goes. The dashboard is the app's landing page — it must load fast, look information-dense, and guide users to deeper views (Analytics, Transactions, Budgets).

---

## Architecture & Layers

```
features/dashboard-widgets/
├── index.ts                        # Public API (exports WIDGET_REGISTRY only)
├── widget-registry.tsx             # Central registry: WidgetType → Component + config
├── model/
│   ├── types.ts                    # DTOs (API shapes) + ViewModels (UI-ready)
│   └── transformers/
│       ├── transformers.ts         # DTO → ViewModel mappers (formatAmount, toMonthlyAmount)
│       ├── transformers.spec.ts    # Tests for formatting logic
│       └── index.ts
├── api/                            # Data hooks (compute from Zustand stores)
│   ├── useKpiQuery/
│   ├── useTrendQuery/
│   ├── useCategoryBreakdownQuery/
│   ├── useBudgetQuery/
│   ├── useRecentTransactionsQuery/
│   ├── useSavingsRateQuery/
│   └── useRecurringExpensesQuery/
└── ui/
    ├── KpiRowWidget/               # 4 KPI cards in a grid row
    ├── TrendChartWidget/           # Line chart: income vs expenses over time
    ├── CategoryDonutWidget/        # Donut chart + legend: expenses by category
    ├── SavingsRateWidget/          # Circular progress: savings rate %
    ├── BudgetProgressWidget/       # Progress bars: budget utilization
    ├── RecentTransactionsWidget/   # Last N transactions list
    ├── RecurringExpensesWidget/    # Recurring/subscription expenses
    ├── hooks/                      # Per-widget hooks (combine API + transform → VM)
    │   ├── useKpiWidget/
    │   ├── useTrendChartWidget/
    │   ├── useCategoryDonutWidget/
    │   ├── useBudgetProgressWidget/
    │   ├── useRecentTransactionsWidget/
    │   ├── useSavingsRateWidget/
    │   └── useRecurringExpensesWidget/
    └── constants/
        └── kpi-config.ts           # KPI icons, labels, colors configuration
```

---

## Data Flow

All api/ hooks return `QueryState<T>` (discriminated union: `notLoaded | loading | loaded | error`).

```
Zustand stores (useTransactionsStore, useBudgetsStore)
   ↓ [api/ hooks: compute from store data]
QueryState<DTO>
   ↓ [ui/hooks/: transform via model/transformers]
QueryState<ViewModel>
   ↓ [QueryRenderer: handles loading/error states]
UI Component (renders ViewModel)
```

### Cross-feature imports

Dashboard api/ hooks import from sibling features (`#features/transactions`, `#features/budgets`). These are documented with `ARCH-EXCEPTION` comments. Planned resolution: migrate to TanStack Query with real backend API when analytics endpoints are implemented.

---

## Public API

```typescript
// Only export: the registry (DashboardPage reads this to render)
export { WIDGET_REGISTRY } from '#features/dashboard-widgets/widget-registry';
```

The `WIDGET_REGISTRY` is a `WidgetConfig[]` — each entry has:
- `id: WidgetType` — enum identifier
- `cols: 1 | 2 | 3 | 4` — grid column span
- `Component: ComponentType` — self-contained widget (hooks + render)

---

## Widget Catalog

| Widget | Data Source | Status |
|--------|-----------|--------|
| KPI Row (balance, income, expenses, savings) | `useKpiQuery` → `useTransactionsStore` | ✅ Real data |
| Trend Chart (income vs expenses line, 6 months) | `useTrendQuery` → `useTransactionsStore` | ✅ Real data |
| Category Donut (expenses breakdown, current month) | `useCategoryBreakdownQuery` → `useTransactionsStore` | ✅ Real data |
| Savings Rate (circular progress, current month) | `useSavingsRateQuery` → `useTransactionsStore` | ✅ Real data |
| Budget Progress (multi-bar) | `useBudgetQuery` → `useBudgetsStore` + `useTransactionsStore` | ✅ Real data |
| Recent Transactions (last 5) | `useRecentTransactionsQuery` → `useTransactionsStore` | ✅ Real data |
| Recurring Expenses (subscriptions) | `useRecurringExpensesQuery` | ⚠️ Mock data (requires pattern detection) |

### Empty States

All widgets handle the case of 0 transactions / 0 budgets gracefully:
- **KPI Row:** Shows "0,00 zł" for all values
- **Trend Chart:** Shows flat zero line
- **Category Donut:** "Brak danych o wydatkach" message
- **Savings Rate:** Shows 0%
- **Budget Progress:** "Brak budżetów" message
- **Recent Transactions:** "Brak transakcji" message

---

## Extension Points

### Adding a new widget

1. Create API hook in `api/useMyWidgetQuery/` returning `QueryState<T>`
2. Create UI hook in `ui/hooks/useMyWidget/` that transforms DTO → ViewModel
3. Create component in `ui/MyWidget/MyWidget.tsx`
4. Register in `widget-registry.tsx`
5. Add `WidgetType.MyWidget` to the enum

### Migrating to backend analytics API

When backend analytics endpoints exist, replace store reads in each `api/use*Query.ts` with TanStack Query + HTTP call:

```typescript
// Current (local-first):
export const useKpiQuery = (): QueryState<KpiDto[]> => {
  const transactions = useTransactionsStore((s) => s.transactions);
  // ... compute from store
  return { status: 'loaded', data };
};

// Future (backend):
export const useKpiQuery = (): QueryState<KpiDto[]> => {
  return useApiQuery(['kpi'], () => httpClient.get<KpiDto[]>('/analytics/kpi'));
};
```

Zero component/UI hook changes — api/ hooks abstract the data source.

---

## Boundaries & Non-Goals

**Does:** Render financial summary widgets from local Zustand stores, provide registry for DashboardPage composition, handle empty states gracefully.

**Does NOT:**
- Fetch data from backend API (local-first architecture, stores are the source of truth)
- Allow widget customization (resize, drag, add/remove) — planned DEC-044
- Detect recurring expenses from transaction patterns (mock data with TODO)
- Persist layout preferences

---

## Limitations

| Feature | Status |
|---------|--------|
| Recurring expense detection | ⚠️ Mock data — requires pattern analysis over 3+ months |
| Widget drag & drop | ❌ Planned (DEC-044) |
| Widget resize | ❌ Planned (DEC-044) |
| User-configurable widget set | ❌ Planned (premium feature) |
| Spending Velocity widget | ❌ Not built |
| Uncategorized Alert badge | ❌ Not built |
| Month-over-month widget | ❌ Not built |
| Dynamic month subtitle | ⚠️ Hardcoded in widget-registry.tsx (advisory) |

---

*Updated: 2026-08-20 | Source: `client/src/features/dashboard-widgets/`*
