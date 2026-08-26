// ═══════════════════════════════════════════════════════════════════
// Budgets Feature — Model Types
// ═══════════════════════════════════════════════════════════════════

// ─── Budget Type ─────────────────────────────────────────────────

export type BudgetType = 'standard' | 'savings';

// ─── Budget Period ───────────────────────────────────────────────

export type BudgetPeriodRecord =
  | { readonly type: 'monthly' }
  | { readonly type: 'yearly' }
  | { readonly type: 'custom'; readonly dateFrom: string; readonly dateTo: string };

// ─── Budget Record (discriminated union — persistence shape) ─────

interface BudgetRecordBase {
  readonly id: string;
  readonly workspaceId: string;
  readonly name: string;
  readonly color: string;
  readonly limitAmount: number;
  readonly limitCurrency: string;
  readonly categoryIds: readonly string[];
  readonly createdAt: string;
  readonly isArchived: boolean;
}

export interface StandardBudgetRecord extends BudgetRecordBase {
  readonly budgetType: 'standard';
  readonly period: BudgetPeriodRecord;
}

export interface SavingsBudgetRecord extends BudgetRecordBase {
  readonly budgetType: 'savings';
  readonly period: null;
}

export type BudgetRecord = StandardBudgetRecord | SavingsBudgetRecord;

// ─── Type Guards ─────────────────────────────────────────────────

export const isStandardBudget = (budget: BudgetRecord): budget is StandardBudgetRecord =>
  budget.budgetType === 'standard';

export const isSavingsBudget = (budget: BudgetRecord): budget is SavingsBudgetRecord =>
  budget.budgetType === 'savings';

// ─── Budget Status (derived, never stored) ───────────────────────

export type BudgetStatus = 'awaitingClosure' | 'overBudget' | 'warning' | 'onTrack' | 'surplus' | 'newPeriod';

// ─── Budget ViewModel (UI-ready, standard budgets) ───────────────

export interface BudgetTransactionVM {
  readonly id: string;
  readonly description: string;
  readonly amount: number;
  readonly currency: string;
  readonly date: string;
}

export interface BudgetViewModel {
  readonly id: string;
  readonly name: string;
  readonly color: string;
  readonly status: BudgetStatus;
  readonly statusLabel: string;
  readonly periodLabel: string;
  readonly daysRemaining: number;
  readonly spent: number;
  readonly limit: number;
  readonly remaining: number;
  readonly currency: string;
  readonly progressPercent: number;
  readonly spentPercent: number;
  readonly timePercent: number;
  readonly transactions: readonly BudgetTransactionVM[];
}

// ─── Savings Budget ViewModel (UI-ready) ─────────────────────────

export interface SavingsInflowEntry {
  readonly id: string;
  readonly amount: number;
  readonly sourceBudgetName: string | undefined;
  readonly date: string;
}

export interface SavingsBudgetViewModel {
  readonly id: string;
  readonly name: string;
  readonly color: string;
  readonly accumulated: number;
  readonly goalAmount: number;
  readonly currency: string;
  readonly progressPercent: number;
  readonly lastInflow: SavingsInflowEntry | null;
}

// ─── Budget KPI ViewModel ────────────────────────────────────────

export interface BudgetKpiVM {
  readonly totalPlanned: number;
  readonly totalSpent: number;
  readonly totalRemaining: number;
  readonly needsAttentionCount: number;
  readonly currency: string;
}

// ─── Budget Filter Types ─────────────────────────────────────────

export type BudgetFilterTab = 'all' | 'needsAttention';

export type BudgetPeriodFilter = 'monthly' | 'yearly' | 'custom' | 'savings';

// ─── Rollover / Closure Types ────────────────────────────────────

export type RolloverOption =
  | { readonly type: 'carry_forward' }
  | { readonly type: 'savings'; readonly targetBudgetId: string }
  | { readonly type: 'discard' };

export interface CloseBudgetPeriodParams {
  readonly budgetId: string;
  readonly spentAmount: number;
  readonly remainingAmount: number;
  readonly rolloverOption: RolloverOption;
  readonly periodFrom: string;
  readonly periodTo: string;
  readonly nextPeriod: BudgetPeriodRecord;
}

// ─── Budget Transaction Input (for transformers) ─────────────────

/**
 * Minimal transaction data needed for budget computation.
 * This is the read contract — wiring happens at page/hook level
 * to avoid cross-feature imports.
 */
export interface BudgetTransactionInput {
  readonly id: string;
  readonly date: string;
  readonly description: string;
  readonly amount: number;
  readonly currency: string;
  readonly budgetId?: string;
}
