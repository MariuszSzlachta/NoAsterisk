import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp } from 'lucide-react';

import { formatAmount } from '#shared/lib';
import { Progress } from '#shared/ui/Progress';

import { useSavingsCard } from '../hooks/useSavingsCard';

// ─── Props ───────────────────────────────────────────────────────

interface SavingsBudgetCardProps {
  readonly budgetId: string;
}

// ─── Component ───────────────────────────────────────────────────

export const SavingsBudgetCard = ({ budgetId }: SavingsBudgetCardProps): React.JSX.Element | null => {
  const { t } = useTranslation();
  const { vm, inflowHistory, isHistoryExpanded, handleToggleHistory } = useSavingsCard({ budgetId });

  if (!vm) {
    return null;
  }

  return (
    <div className="flex flex-col rounded-lg border border-border bg-surface p-5 shadow-card">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-base">💰</span>
        <span className="text-sm font-semibold text-foreground">{vm.name}</span>
      </div>

      {/* Subtitle */}
      <span className="mt-1 text-xs text-muted-foreground">
        {t('budgets.savings.subtitle')}
      </span>

      {/* Amounts row */}
      <div className="mt-4 flex items-baseline justify-between">
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">{t('budgets.savings.accumulated')}</span>
          <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
            {formatAmount(vm.accumulated)} {vm.currency}
          </span>
        </div>
        {vm.goalAmount > 0 && (
          <div className="flex flex-col items-end">
            <span className="text-xs text-muted-foreground">{t('budgets.savings.goal')}</span>
            <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
              {formatAmount(vm.goalAmount)} {vm.currency}
            </span>
          </div>
        )}
      </div>

      {/* Progress toward goal */}
      {vm.goalAmount > 0 && (
        <div className="mt-3">
          <Progress value={vm.progressPercent} color="income" />
          <span className="mt-1.5 text-xs text-muted-foreground">
            {t('budgets.savings.progressLabel', { percent: vm.progressPercent })}
          </span>
        </div>
      )}

      {/* Last inflow */}
      {vm.lastInflow && (
        <div className="mt-3 text-xs text-muted-foreground">
          {t('budgets.savings.lastInflow', {
            amount: formatAmount(vm.lastInflow.amount),
            source: vm.lastInflow.sourceBudgetName ?? t('budgets.savings.unknownSource'),
          })}
        </div>
      )}

      {/* Inflow history toggle */}
      {inflowHistory.length > 0 && (
        <div className="mt-3 border-t border-border pt-3">
          <button
            type="button"
            className="flex items-center gap-1 text-xs text-muted-foreground transition-colors duration-150 hover:text-foreground"
            onClick={handleToggleHistory}
            aria-expanded={isHistoryExpanded}
          >
            {t('budgets.savings.inflowHistory')}
            {isHistoryExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {isHistoryExpanded && (
            <div className="mt-2 space-y-1.5">
              {inflowHistory.map((inflow) => (
                <div key={inflow.id} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {inflow.sourceBudgetName ?? t('budgets.savings.unknownSource')} · {inflow.displayDate}
                  </span>
                  <span className="font-mono tabular-nums text-income">
                    +{formatAmount(inflow.amount)} {vm.currency}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
