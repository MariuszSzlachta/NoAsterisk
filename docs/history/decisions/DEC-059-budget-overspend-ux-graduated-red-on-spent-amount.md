# DEC-059 — Budget Overspend UX — Graduated Red on Spent Amount

## Source status

Recovered historical decision dated 2026-06-29 with explicit status **Accepted**. It was recovered on 2026-08-01 from an untracked temporary workspace used on another computer. Its identifier, date and implementation are corroborated by BudgetFlow commit `9fa9a56` (`feat(budget): graduated red color on overspent budget amounts (DEC-059)`). Chronological presence does not prove current authority.

## Preserved decision record

**Date:** 2026-06-29  
**Status:** Accepted  
**Context:** Budgets often exceed 100% (people overspend). Need visual indicator without changing the progress bar color (which will be user-configurable per budget).

**Decision:** Color the "spent" amount text (X in "X / Y PLN") with graduated red intensity based on overspend level:
- ≤ 100%: normal `text-muted-foreground`
- 100–125%: `text-expense/60` (light red)
- 125–150%: `text-expense/80` (medium red)
- > 150%: `text-expense` (full red)

The limit value (Y) stays neutral. Progress bar color stays as category color (user-configurable in future).

**Rejected alternatives:**
- Changing progress bar color to red on overspend — rejected because bar color will be user-set per budget
- Adding "+X%" overflow text — too noisy for compact widget
- Separate "Budget Health" gauge widget (4.2.8.4) — abandoned, redundant with existing budget list that already shows utilization

**Future enhancement:** User-configurable alert thresholds per budget + notifications when approaching/exceeding limit (requires notifications system).

## Related records

- [DEC-060](./DEC-060-abandon-4-2-8-4-budget-health-gauge-widget.md) records the related decision to abandon the aggregate Budget Health widget.
- [Phase 4.2.8 dashboard polish](../../plans/archive/phase-4-2-8-dashboard-polish.md) preserves the original widget plan and abandoned status.

## Source provenance

- Recovered source: `decision-log.md` from an untracked BudgetFlow `temp` workspace
- Recovery copy inspected from an owner-provided local decision-log export.
- Recovered on: 2026-08-01
- Original identifier: `DEC-059`
- Recovered source order: 1 of 3
- Chronological corpus position: after DEC-058
- Decision date stated by source: 2026-06-29
- Original temp-file metadata supplied with the recovery: created 2026-06-29 18:14:13, modified 2026-06-29 19:37:48
- Corroborating application commit: `9fa9a56`
- The desktop copy's filesystem dates reflect copying on 2026-08-01; the earlier timestamps above come from `file-metadata.md`, captured from the original `temp/` files
