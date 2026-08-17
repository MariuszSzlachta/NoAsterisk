// ═══════════════════════════════════════════════════════════════════
// Budgets Feature — Model Types
// ═══════════════════════════════════════════════════════════════════

// ─── Budget Type ─────────────────────────────────────────────────

export type BudgetType = 'standard' | 'savings';

// ─── Budget Record (persistence shape, stored in Zustand) ────────

export type BudgetPeriodRecord =
  | { readonly type: 'monthly' }
  | { readonly type: 'yearly' }
  | { readonly type: 'custom'; readonly dateFrom: string; readonly dateTo: string };

export interface BudgetRecord {
  readonly id: string;
  readonly workspaceId: string;
  readonly budgetType: BudgetType;
  readonly name: string;
  readonly color: string;
  readonly limitAmount: number;
  readonly limitCurrency: string;
  readonly period: BudgetPeriodRecord | null;
  readonly categoryIds: readonly string[];
  readonly createdAt: string;
  readonly isArchived: boolean;
}

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
  readonly sourceBudgetName: string;
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
 * Avoids cross-feature import (FSD boundary).
 * Wiring happens at page/hook level.
 */
export interface BudgetTransactionInput {
  readonly id: string;
  readonly date: string;
  readonly description: string;
  readonly amount: number;
  readonly currency: string;
  readonly budgetId?: string;
}
