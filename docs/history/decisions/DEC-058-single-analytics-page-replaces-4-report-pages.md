# DEC-058 — Single /analytics page replaces 4 report pages

## Source status

Historical decision recorded on 2026-06-27. The source provides an explicit decision statement. The source does not assign a separate lifecycle status to this record. Chronological presence does not prove current authority.

## Preserved decision record

**Date:** 2026-06-27
**Context:** Dashboard KPI icons led to 4 separate /reports/X pages (BalanceReportPage, IncomeReportPage, ExpenseReportPage, SavingsReportPage) — identical layout, different data. DRY violation, lack of user control.

**Decision:** One `/analytics?metric=X` with toolbar filters (multi-select metrics, period, chartType, granularity). KPI icons → deep link `/analytics?metric=expenses`.

**Structure:**
```
features/analytics/
  model/types.ts       ← MetricType, Period, ChartType, Granularity, AnalyticsFilters
  api/useAnalyticsQuery.ts  ← mock data filtered by metrics (QueryState<AnalyticsData>)
  ui/AnalyticsToolbar.tsx   ← metric pills, period presets, chart type, granularity
  ui/AnalyticsChart.tsx     ← LineChart (semantic colors per series ID)
  ui/AnalyticsKpiRow.tsx    ← contextual KPIs with delta vs previous period
  index.ts
pages/AnalyticsPage.tsx     ← reads ?metric= from URL, manages filter state
```

**Routing:** `/analytics` (single route), query params for deep linking.
**Sidebar:** "Analysis" (BarChart3 icon) added to nav.

**TODO (separate bullet):**
- Category breakdown (donut + list) under KPI — visible when metric=expenses|income
- Top merchants table (when metric=expenses)
- Filter state sync to URL (replace searchParams on change)
- Bar/Area chart renderers (currently LineChart only, _chartType placeholder)

**Supersedes:** 4.2.7.3 report pages (deleted BalanceReportPage, IncomeReportPage, ExpenseReportPage, SavingsReportPage, ReportLayout).

## Source provenance

- Original source: legacy decision log
- Pre-atomization path: `docs/history/decision-log.md`
- Original identifier: `DEC-058`
- Original order: 59 of 59
- Original source lines: 1171–1199
- Frozen source commit: `582b3e8b147293c7b33dd0f839839aa81d7c8c20`
