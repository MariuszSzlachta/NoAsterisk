import { useTranslation } from 'react-i18next';
import { PiggyBank, Receipt, Wallet, AlertTriangle } from 'lucide-react';

import { formatAmount } from '#shared/lib';
import { KpiCard } from '#shared/ui/KpiCard';

import { useBudgetKpi } from '../hooks/useBudgetKpi';

// ─── Component ───────────────────────────────────────────────────

export const BudgetKpiRow = (): React.JSX.Element => {
  const { t } = useTranslation();
  const kpi = useBudgetKpi();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        label={t('budgets.kpi.totalPlanned')}
        value={`${formatAmount(kpi.totalPlanned)} ${kpi.currency}`}
        icon={<PiggyBank size={18} />}
      />
      <KpiCard
        label={t('budgets.kpi.totalSpent')}
        value={`${formatAmount(kpi.totalSpent)} ${kpi.currency}`}
        icon={<Receipt size={18} />}
      />
      <KpiCard
        label={t('budgets.kpi.totalRemaining')}
        value={`${formatAmount(kpi.totalRemaining)} ${kpi.currency}`}
        icon={<Wallet size={18} />}
      />
      <KpiCard
        label={t('budgets.kpi.needsAttention')}
        value={String(kpi.needsAttentionCount)}
        icon={<AlertTriangle size={18} />}
      />
    </div>
  );
};
