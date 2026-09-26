# DEC-060 — Abandon 4.2.8.4 (Budget Health Gauge Widget)

## Source status

Recovered historical decision dated 2026-06-29 with explicit status **Abandoned**. It was recovered on 2026-08-01 from an untracked temporary workspace used on another computer. The identifier and outcome are independently corroborated by the development roadmap entry for Phase 4.2.8.4. This record describes an abandoned proposal, not implemented current behavior.

## Preserved decision record

**Date:** 2026-06-29  
**Status:** Abandoned  
**Context:** The "Budget Health" widget was planned as a radial gauge showing overall % budget utilization.

**Decision:** Abandon. The existing "Budgets" widget already shows per-budget utilization with progress bars. Adding an aggregate gauge adds no new insight — users can see at a glance which budgets are on track. Overspend is now indicated via graduated color on spent amounts.

**Future idea:** If users configure notification thresholds (e.g. 80%) per budget, a notification system could alert them when approaching limits with N days remaining in the month.

## Related records

- [DEC-059](./DEC-059-budget-overspend-ux-graduated-red-on-spent-amount.md) defines the graduated overspend indication used instead of the gauge.
- [Phase 4.2.8 dashboard polish](../../plans/archive/phase-4-2-8-dashboard-polish.md) preserves task 4.2.8.4 and its abandoned lifecycle status.

## Source provenance

- Recovered source: `decision-log.md` from an untracked BudgetFlow `temp` workspace
- Recovery copy inspected from an owner-provided local decision-log export.
- Recovered on: 2026-08-01
- Original identifier: `DEC-060`
- Recovered source order: 2 of 3
- Chronological corpus position: after DEC-059
- Decision date stated by source: 2026-06-29
- Original temp-file metadata supplied with the recovery: created 2026-06-29 18:14:13, modified 2026-06-29 19:37:48
- Corroborating roadmap reference: Phase 4.2.8.4, `Abandoned (DEC-060)`
- The desktop copy's filesystem dates reflect copying on 2026-08-01; the earlier timestamps above come from `file-metadata.md`, captured from the original `temp/` files
