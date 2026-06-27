import type { ReactNode } from 'react';

// --- DTO types (API response shapes) ---

export type KpiId = 'balance' | 'income' | 'expenses' | 'savings';

export interface KpiDto {
  readonly id: KpiId;
  readonly label: string;
  readonly value: string;
  readonly deltaPercent?: string;
  readonly trend?: 'up' | 'down' | 'neutral';
  readonly tooltip?: string;
}

export interface BudgetDto {
  readonly label: string;
  readonly spent: number;
  readonly limit: number;
  readonly color: string;
}

export interface RecentTransactionDto {
  readonly id: string;
  readonly merchant: string;
  readonly category: string;
  readonly date: string;
  readonly amount: string;
  readonly direction: 'income' | 'expense';
}

// --- ViewModel types (UI-ready) ---

export interface KpiItemVM {
  readonly label: string;
  readonly value: string;
  readonly icon: ReactNode;
  readonly delta?: string;
  readonly trend?: 'up' | 'down' | 'neutral';
  readonly tooltip?: string;
  readonly iconHref?: string;
}

export interface RecentTransactionVM {
  readonly id: string;
  readonly merchant: string;
  readonly category: string;
  readonly date: string;
  readonly amount: string;
  readonly direction: 'income' | 'expense';
}

export interface BudgetItemVM {
  readonly label: string;
  readonly spent: number;
  readonly limit: number;
  readonly color: string;
}
