# Analytics Feature — Developer Guide

## Domain Context

Users view financial trends, KPIs, and category breakdowns over configurable time periods. The analytics page provides deeper insight than the dashboard — supporting multiple metrics, granularity levels, and interactive category drilldowns.

---

## Architecture

```
features/analytics/
├── index.ts                        # Public API
├── model/
│   ├── types.ts                    # MetricType, Period, Granularity, AnalyticsFilters, etc.
│   ├── compute-analytics/          # Pure computation functions (tested)
│   │   ├── compute-analytics.ts    # getDateRange, getBuckets, computeDelta, etc.
│   │   ├── compute-analytics.spec.ts
│   │   └── index.ts
│   ├── getTrendClass/              # CSS class helper for trend direction
│   ├── getSeriesColors/            # Chart color mapping
│   ├── parseMetricsParam/          # URL param parsing
│   └── transformers/               # DTO → ViewModel mappers
├── api/
│   ├── useAnalyticsQuery/          # Main chart series + KPIs
│   ├── useCategoryBreakdownQuery/  # Category proportions (expenses/income)
│   └── useCategoryDrilldownQuery/  # Per-category trend + transaction list
├── store/
│   └── useAnalyticsFiltersStore/   # Zustand: period, metrics, granularity, chartType
└── ui/
    ├── AnalyticsToolbar/           # Filter controls
    ├── AnalyticsChart/             # Line chart (Nivo adapter)
    ├── AnalyticsKpiRow/            # KPI cards row
    ├── AnalyticsCategoryBreakdown/ # Category list + drilldown
    ├── CategoryDrilldown/          # Monthly trend + transactions for one category
    ├── BreakdownListItem/          # Single category bar item
    ├── TransactionRow/             # Transaction row in drilldown
    └── hooks/
        ├── useAnalyticsFilters/    # Combines store + URL params
        ├── useAnalyticsToolbar/    # Toolbar handlers
        └── useCategoryBreakdown/   # Breakdown selection state
```

---

## Data Flow

```
useAnalyticsFiltersStore (Zustand)
  ↓ filters: { metrics, period, granularity, chartType }
useAnalyticsQuery(filters) → reads useTransactionsStore
  ↓ computes series per metric + KPIs with delta
QueryState<{ series, kpis }>
  ↓ AnalyticsChart renders series, AnalyticsKpiRow renders KPIs

useCategoryBreakdownQuery(filters) → reads useTransactionsStore
  ↓ groups by categoryId, computes percentages
QueryState<CategoryBreakdownItem[]>
  ↓ AnalyticsCategoryBreakdown renders list

useCategoryDrilldownQuery(category, filters) → reads useTransactionsStore
  ↓ builds 6-month trend + last 10 transactions
QueryState<CategoryDrilldownData>
  ↓ CategoryDrilldown renders trend chart + transaction list
```

### Cross-feature imports

All api/ hooks import from `#features/transactions` (read-only `useTransactionsStore`). Documented with `ARCH-EXCEPTION` comments. Planned resolution: migrate to TanStack Query with real backend API.

---

## Configuration

**Period options:** 1m, 3m, 6m, 1y, ytd
**Granularity:** daily, weekly, monthly
**Metrics:** income, expenses, savings, balance (multi-select)
**Chart types:** line, bar, area (only line implemented currently)

---

## Model Layer (Pure Functions)

`model/compute-analytics/` contains all computation logic — zero React dependencies:

| Function | Purpose |
|----------|---------|
| `getDateRange(period)` | Period → `{ from: string, to: string }` |
| `getDateRangeAsDate(period)` | Period → `{ from: Date, to: Date }` |
| `getBuckets(from, to, granularity)` | Generate time buckets for chart X-axis |
| `computeMetricForBucket(tx, bucket, metric, all)` | Single data point value |
| `computeMetricForPeriod(tx, all, end, metric)` | KPI total for a period |
| `computeDelta(current, previous)` | Formatted percentage change |
| `computeTrend(current, previous)` | 'up' \| 'down' \| 'neutral' |
| `getCategoryLabel(categoryId)` | Resolve category ID to label |
| `formatAnalyticsAmount(amount)` | Polish locale formatting with "zł" |

---

## Empty States

- **Chart:** Shows flat line at 0 when no transactions in period
- **KPIs:** Show "0,00 zł" with neutral trend
- **Category breakdown:** "Brak wydatków/przychodów w wybranym okresie"
- **Category drilldown:** Empty trend (all zeros) + empty transaction list

---

## Limitations

| Feature | Status |
|---------|--------|
| Category labels | ⚠️ Hardcoded stub (ARCH-EXCEPTION) — no categories feature yet |
| Bar/Area chart types | ❌ Only line chart implemented |
| Export to CSV/PDF | ❌ Not implemented |
| Custom date range | ❌ Only preset periods |
| Backend aggregation API | ❌ Local computation from Zustand store |

---

*Updated: 2026-08-20 | Source: `client/src/features/analytics/`*
