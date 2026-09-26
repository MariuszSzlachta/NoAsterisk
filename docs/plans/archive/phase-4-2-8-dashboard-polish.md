# Phase 4.2.8: Dashboard Polish & New Widgets

> **Source status:** The source mixes an implementation specification with checklist states and one explicitly completed chart replacement. Overall completion is unresolved.
+
+> **Recovered source:** The abandoned Budget Health widget is explained by recovered [DEC-060](../../history/decisions/DEC-060-abandon-4-2-8-4-budget-health-gauge-widget.md). See the [recovery integrity record](../../history/decisions/integrity-issues.md#recovered-dec-059-dec-060-and-dec-061) for provenance.


| # | Task | Status |
|---|---|---|
| 4.2.8.1 | Colorful categories in "Recent Transactions" — colored dot for each transaction category (consistency with donut and budgets) | ✅ Done |
| 4.2.8.2 | Tile next to the donut — "Savings Rate" (circular progress, % of income saved in the month, e.g. 29%) | ✅ Done |
| 4.2.8.3 | "Recurring Expenses" widget — list of recurring expenses (subscriptions, fixed fees) with monthly total | ✅ Done |
| 4.2.8.4 | "Budget Health" widget — gauge/radial indicator, overall % of budget utilization (green/yellow/red) | ❌ Abandoned (DEC-060) |
| 4.2.8.5 | "Spending Velocity" widget — mini chart: spending rate vs day of the month, forecast if you'll stay within the plan | ⬜ |
| 4.2.8.6 | "Uncategorized" alert badge — number of transactions without a category, CTA to categorize | ⬜ |
| 4.2.8.7 | "Month-over-month" widget — one number: % change in spending vs previous month with up/down arrow | ⬜ |

### Frontend specification

**4.2.8.1 — Colorful categories in transactions**
- Add a colored dot (8px circle) to the left of the icon or instead of the gray icon in the `RecentTransactions` widget
- Color = category color from the donut (consistent palette)
- Negative amounts: saturated red (`text-destructive`), income: saturated green (`text-success`)
- Optional: subtle background on icons in the category color (opacity 10%)

**4.2.8.2 — Savings Rate tile**
- Place next to the donut (right column, below the donut or as a separate tile in the same row)
- Circular progress (Nivo radial bar or custom SVG ring)
- Formula: `savings / income * 100` (e.g. 2450/8500 ≈ 29%)
- Color: green > 20%, yellow 10-20%, red < 10%
- Label: "Savings Rate" + value % + absolute amount below

**4.2.8.3 — Recurring Expenses**
- **Definition of recurring (MVP):** manual tagging — flag `isRecurring: boolean` + `recurrenceCycle: 'monthly' | 'yearly'` on Transaction entity. User tags a transaction as recurring.
- **Auto-detection (post-MVP):** same merchant + similar amount (±10%) ≥ 3 months in a row → auto-flag as recurring.
- **Conversion:** ✅ recurring annual expenses converted to monthly (240 zł/yr → 20 zł/mo) in "Total/mo."
- **What to display:** top 5 sorted by monthly amount desc + link "All →"
- ✅ Each item: name + amount + cycle (mo./yr.)
- ✅ Summary row at the bottom: "Total: X zł/mo."
- **Layout:** fixed height widget (max 5 items), internal scroll in the table, summary row sticky. Dashboard does not scroll — widget fits in viewport.
- **Location:** Row 3 next to "Recent Transactions" (50/50) — DO NOT add a new row below budgets.

**Status 4.2.8.3:** ✅ DONE
- ✅ Widget component + hook + mock data + tests (formatAmount, toMonthlyAmount)
- ✅ Sorting top 5 by monthly amount desc
- ✅ Link "All →" (action prop)
- ✅ Location in row 3 grid (grid-rows: 1.5fr_1.5fr_1.3fr)
- ⬜ Dashboard no-scroll (requires compromise — 4 widget rows do not fit in 1080px viewport; solution: reduce height of chart row OR merge Budgets with something)

**4.2.8.4 — Budget Health gauge**
- One radial/gauge chart: overall % = total expenses / total budget limits
- Colors: < 70% green, 70-90% yellow, > 90% red
- Text in the center: "72%" + "in norm" / "warning" / "over budget"
- Small tile (1 column), next to savings rate or in a new row

**4.2.8.5 — Spending Velocity**
- Mini area chart: X-axis = days of the month (1-30), Y-axis = cumulative spending
- Straight line = ideal (linear) budget distribution
- Curved line = actual spending rate
- Text: "Day 28/30 — spent 95% of budget"
- If ahead of pace → yellow/red, behind → green

**4.2.8.6 — Uncategorized alert**
- Small badge/chip on the dashboard (or in the budgets header)
- Text: "12 transactions without a category"
- Click → navigation to `/transactions?filter=uncategorized`
- Color: yellow (warning)

**4.2.8.7 — Month-over-month trend**
- KpiCard-style tile (can be fifth in the top row or separated)
- One number: "+5.3%" or "-2.1%"
- Arrow up (red = more spending) / arrow down (green = less spending)
- Subtitle: "vs previous month"

### Layout grid (final placement — NO SCROLL)

```
Row 1: [KPI x4]
Row 2: [Trend chart (2/3)] [Donut + Savings Rate tile (1/3)]
Row 3: [Budgets (1/2)] [Recurring Expenses (1/2)]  ← recurring next to budgets
Row 4: [Recent Transactions (1/2)] [Budget Health + Spending Velocity (1/2)]
```

**Rule:** Dashboard fits in viewport without scroll. Widgets with lists (Recurring Expenses, Recent Transactions) have fixed height + internal scroll. Summary row is sticky.

### Implementation Priority

1. **4.2.8.1** (colorful categories) — quick win, improves color balance on the right side
2. **4.2.8.2** (savings rate) — fills the gap next to the donut
3. **4.2.8.7** (month-over-month) — simple tile, high informational value
4. **4.2.8.6** (uncategorized alert) — small, but motivates action
5. **4.2.8.4** (budget health) — new widget, requires gauge component
6. **4.2.8.3** (recurring) — requires recurring detection logic
7. **4.2.8.5** (spending velocity) — most complex chart

### Chart Change: Donut → Horizontal Bar (Analytics breakdown) — ✅ DONE

**Problem:** Donut + legend take up ~40% of the card, the rest is empty space. Donut does not scale on wide cards.

**Solution:** Replace the donut with a **horizontal bar chart** in the "Expenses by category" section on the Analytics page.

**Specification:**
- Each category = colored bar (sorted desc by amount)
- Label on the left: category name
- Value on the right: amount + percentage
- Colored bar proportional to max category (not 100% — largest = full width, others proportionally)
- Total at the top of the card: "7 150 zł / mo." (moved from the center of the donut)
- Click on the bar → expands drill-down (trend + transactions, as it is now)
- Bar colors = same palette as the donut (consistency with dashboard)
- On the dashboard (small widget) the donut REMAINS — it is compact and works there. The change applies ONLY to the Analytics page where the card is full-width.

---

## Source Provenance

- Original source: legacy development plan
- Pre-atomization path: `docs/plans/roadmap.md`
- Original source lines: 240–347
- Frozen source commit: `582b3e8b147293c7b33dd0f839839aa81d7c8c20`
