# Phase 4.6: Budget Period Closure & Rollover FE — ✅ COMPLETE

> **Source status:** 9 bullets implemented, all individually code-reviewed, architect review passed, final review passed. 71 tests, tsc clean.

## Summary

Extended `features/budgets/` with period closure lifecycle, surplus rollover, and savings budget type. All local-first (Zustand + localStorage, zero API calls). 31 files changed.

---

## Deliverables

| # | Bullet | Status |
|---|---|---|
| 1 | Model — BudgetType, nullable period, awaitingClosure status, savings types | ✅ Done |
| 2 | Model — PeriodHistory types + computeSavingsBalance + getInflowHistory | ✅ Done |
| 3 | Model — budget-status: periodEnded param for awaitingClosure detection | ✅ Done |
| 4 | Model — transformers: mapSavingsBudgetToViewModel, computeNextPeriod, hasBeenClosed | ✅ Done |
| 5 | Store — usePeriodHistoryStore (Zustand persist) | ✅ Done |
| 6 | Store — useBudgetsStore.closeBudgetPeriod action | ✅ Done |
| 7 | UI — BudgetCard closure banner (amber warning + close button) | ✅ Done |
| 8 | UI — PeriodClosureModal (rollover options: carry_forward, savings, discard) | ✅ Done |
| 9 | UI — SavingsBudgetCard (accumulated, goal, progress, inflow history) | ✅ Done |
| — | UI — BudgetFormModal budget type toggle (Standard/Savings) | ✅ Done (within bullet 9) |
| — | Pages — BudgetsPage savings section + closure modal wiring | ✅ Done (within bullet 9) |
| — | i18n — full Polish translations | ✅ Done (within bullet 9) |

---

## Architecture Decisions (within phase)

- Period lifecycle: ACTIVE → AWAITING_CLOSURE (custom periods) → CLOSED
- monthly/yearly auto-advance via `getPeriodRange(now)` — practically never reach awaitingClosure
- Savings budgets: `period: null`, accumulates from rollovers via PeriodHistory
- Store receives pre-computed `CloseBudgetPeriodParams` from UI hook (hook computes next period, amounts)
- `computeNextPeriod` preserves period type identity (monthly stays monthly, custom advances by duration)
- Savings balance = sum of all `RolloverRecord.amount` targeting that savings budget (derived from history, not stored)

---

## Key files created

- `features/budgets/model/period-history.ts` — PeriodHistoryRecord, RolloverRecord, computation functions
- `features/budgets/store/usePeriodHistoryStore/` — append-only audit trail (Zustand persist)
- `features/budgets/ui/PeriodClosureModal/` — closure flow modal
- `features/budgets/ui/SavingsBudgetCard/` — savings budget card variant
- `features/budgets/ui/hooks/usePeriodClosure/` — closure logic hook
- `features/budgets/ui/hooks/useSavingsCard/` — savings card ViewModel + inflow history

## Key files modified

- `features/budgets/model/types.ts` — BudgetType, nullable period, RolloverOption, CloseBudgetPeriodParams, SavingsBudgetViewModel
- `features/budgets/model/budget-status.ts` — awaitingClosure state + periodEnded parameter
- `features/budgets/model/transformers.ts` — mapSavingsBudgetToViewModel, computeNextPeriod, hasBeenClosed
- `features/budgets/store/useBudgetsStore/useBudgetsStore.ts` — closeBudgetPeriod action
- `features/budgets/ui/BudgetCard/BudgetCard.tsx` — closure banner
- `features/budgets/ui/BudgetFormModal/BudgetFormModal.tsx` — budget type toggle
- `features/budgets/ui/hooks/useBudgetForm/useBudgetForm.ts` — savings mode (no period, goal label)
- `pages/BudgetsPage.tsx` — savings section + closure modal wiring
- `shared/i18n/locales/pl.json` — status, closure, savings, form keys

---

## Tech Debt Noted (pre-existing)

- `useBudgetFilters` hook unused (page manages filter state directly)
- `doesPeriodOverlap` in `useBudgetGrid` hook instead of `model/`
- Handlers defined in page body instead of wiring hook
- Hardcoded Polish validation strings in `useBudgetForm`

---

## Dependencies

- ADR-009 (budget entity design) — implemented
- Phase 4.5 (budgets page) — predecessor, implemented

## Developer Guide

- [Budgets feature guide](../../guides/frontend/budgets-feature.md)
