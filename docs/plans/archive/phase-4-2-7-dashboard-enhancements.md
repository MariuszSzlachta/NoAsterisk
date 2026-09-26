# Phase 4.2.7: Dashboard Enhancements (interaction + navigation)

> **Source status:** The source contains a mixed checklist and does not state an overall phase status. Preserve as unresolved historical planning evidence.


| # | Task | Status |
|---|---|---|
| 4.2.7.1 | Tooltip on KPI — tooltip explaining the metric on each KpiCard | ✅ Done |
| 4.2.7.2 | Clickable KPI icons — clicking opens a detailed report (balance, income, expenses, savings) | ✅ Done |
| 4.2.7.3 | KPI reports → single /analytics page with filters (DEC-058) | ✅ Done |
| 4.2.7.4 | Navigation buttons on widgets — links to Transactions, Budgets, Analysis on the appropriate widgets | ✅ Done |
| 4.2.7.5 | Analytics: category breakdown (donut + list) under KPI, visible when metric=expenses/income | ✅ Done |

**4.2.7.5 — Fixes to be done after review:**
1. ~~**"Other" tail bucket**~~ — N/A (horizontal bars, not donut — all categories visible)
2. **Area chart instead of line** — trend per category: when there is little variance (e.g., 1.9k–2.3k), area chart is more readable than a bare line
3. ~~**Colored dot for categories in transactions**~~ — ✅ Done (4.2.8.1)
4. **Delta color** — ensure that a decrease in expenses is green (good), increase is red (bad). Opposite logic than for income.
| 4.2.7.6 | Analytics: filter state sync to URL (shareableURLs), bar/area chart renderers | ⬜ |

---

## Source provenance

- Original source: legacy development plan
- Pre-atomization path: `docs/plans/roadmap.md`
- Original source lines: 221–239
- Frozen source commit: `582b3e8b147293c7b33dd0f839839aa81d7c8c20`
