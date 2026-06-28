import React, { type ReactNode } from 'react';
import {
  CircleHelp,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';

import type { KpiId } from '#features/dashboard-widgets/model/types';

export const KPI_ICONS: Record<KpiId, ReactNode> = {
  balance: React.createElement(Wallet, { size: 16 }),
  income: React.createElement(TrendingUp, { size: 16 }),
  expenses: React.createElement(TrendingDown, { size: 16 }),
  savings: React.createElement(DollarSign, { size: 16 }),
};

export const KPI_REPORT_HREFS: Record<KpiId, string> = {
  balance: '/analytics?metric=balance',
  income: '/analytics?metric=income',
  expenses: '/analytics?metric=expenses',
  savings: '/analytics?metric=savings',
};

export const FALLBACK_ICON: ReactNode = React.createElement(CircleHelp, {
  size: 16,
});

export const KPI_ICON_TOOLTIPS: Record<KpiId, string> = {
  balance: 'Otwórz analizę salda',
  income: 'Otwórz analizę przychodów',
  expenses: 'Otwórz analizę wydatków',
  savings: 'Otwórz analizę oszczędności',
};

export const INVERTED_COLOR_KPI_IDS: ReadonlySet<KpiId> = new Set(['expenses']);
