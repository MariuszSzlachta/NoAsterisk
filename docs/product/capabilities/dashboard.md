# Dashboard — What You See On The Main Page

> **Current state:** KPIs, trends, category breakdown, savings rate, budgets and
> recent transactions are computed from local financial state. Recurring-expense
> detection is not implemented and that widget still uses placeholder data.

## User Problem

Ola opens the budget app once a day for 30 seconds. She wants to see: how much she has in her account, whether she's within budget, and what the money was spent on this month. No clicking, no searching — immediately, on one page.

---

## What You See (top to bottom)

### Row 1: Four Key Numbers (KPI)

| Tile | What it shows | Example |
|---------|-----------|---------|
| 💰 Balance | Current account balance | 12 450,00 zł |
| 📈 Income | Total income this month | +8 500,00 zł |
| 📉 Expenses | Total expenses this month | −6 050,00 zł |
| 🏦 Savings | Income minus expenses | +2 450,00 zł |

Each tile has:
- An arrow showing change vs previous month (e.g. "▲ 12%" = you're spending 12% more)
- An info icon (hover → tooltip explains the metric)
- A clickable icon → opens detailed analysis for that metric

### Row 2: Charts

**Left side (2/3 width):** Line chart "Income vs Expenses" — 6 months of history, two lines (green = income, pink = expenses).

**Right side (1/3):** Pie chart (donut) "Expenses by Category" — what % of budget is consumed by: Groceries, Transport, Subscriptions, Eating Out, Bills etc. + "Savings Rate" tile (circular progress: 29% = you saved 29% of income).

### Row 3: Budgets + Recurring Expenses

**Left side:** Budget progress bars — each budget (e.g. "Food: 1200/1500 zł") with a colored bar (green = OK, yellow = >70%, red = >90%).

**Right side:** "Recurring Expenses" — list of subscriptions/fixed charges (Netflix, Spotify, ZUS, insurance). Top 5 sorted by amount. Total at the bottom ("Total: 850 zł/month").

### Row 4: Recent Transactions

List of 5-8 recent transactions with a colored category dot, name, date, and amount. "View all →" link leads to the full list.

---

## Navigation From Dashboard

| Click | Where it leads |
|-----------|---------------|
| Icon on KPI tile | `/analytics?metric=expenses` (or income/balance/savings) |
| "View all →" under transactions | `/transactions` |
| "View all →" under budgets | `/budgets` |
| "View all →" under recurring expenses | `/transactions?filter=recurring` |
| Category slice in donut | Category details in Analytics |

---

## Rules

- Dashboard fits on one screen (no scrolling on 1080p). Widgets with lists have internal scroll.
- Data refreshed automatically in the background (every 30 seconds).
- Dark theme by default. Light available in settings.
- All amounts in PLN with Polish format (1 234,56 zł).
- Income (green) and expense (pink) colors consistent across the entire application.

---

## Limitations (current state)

| Limitation | Plan |
|-------------|------|
| Recurring-expense widget uses placeholder data | Local recurring detection is not implemented |
| No widget personalization (order, size) | Drag & drop (planned, DEC-044) |
| No "Spending Pace" widget | To be implemented (4.2.8.5) |
| No "Uncategorized" badge | To be implemented (4.2.8.6) |
| No month-to-month comparison | To be implemented (4.2.8.7) |
| Recurring expenses: manual marking (no auto-detection) | Auto-detection planned (post-MVP) |

---

*Updated: 2026-09-25*
