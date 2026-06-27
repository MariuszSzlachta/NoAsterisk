import { CircleHelp, DollarSign, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import type { ReactNode } from 'react';
import React from 'react';

import type { KpiId } from '#features/dashboard-widgets/model/types';

export const KPI_ICONS: Record<KpiId, ReactNode> = {
  balance: React.createElement(Wallet, { size: 16 }),
  income: React.createElement(TrendingUp, { size: 16 }),
  expenses: React.createElement(TrendingDown, { size: 16 }),
  savings: React.createElement(DollarSign, { size: 16 }),
};

export const KPI_REPORT_HREFS: Record<KpiId, string> = {
  balance: '/reports/balance',
  income: '/reports/income',
  expenses: '/reports/expenses',
  savings: '/reports/savings',
};

export const FALLBACK_ICON: ReactNode = React.createElement(CircleHelp, { size: 16 });
