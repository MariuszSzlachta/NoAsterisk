import type { ReactNode } from 'react';

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
