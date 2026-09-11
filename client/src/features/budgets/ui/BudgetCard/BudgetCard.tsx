import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp, Pencil, Plus, AlertTriangle, Trash2 } from 'lucide-react';

import { formatAmount } from '#shared/lib';
import { Badge } from '#shared/ui/Badge';
import { Progress } from '#shared/ui/Progress';
import { Button } from '#shared/ui/Button';

import type { BudgetStatus } from '#features/budgets/model/types/budget-status';
import type { BudgetViewModel } from '#features/budgets/model/types/budget-view-model';
import { useBudgetCard } from '../hooks/useBudgetCard';
import { BudgetTransactionList } from './BudgetTransactionList';

// ─── Status → Design System Variant Mapping ──────────────────────

const STATUS_BADGE_COLOR: Record<BudgetStatus, 'expense' | 'warning' | 'income' | 'blue' | 'neutral'> = {
  awaitingClosure: 'warning',
  overBudget: 'expense',
  warning: 'warning',
  onTrack: 'income',
  surplus: 'income',
  newPeriod: 'blue',
};

const STATUS_PROGRESS_COLOR: Record<BudgetStatus, 'primary' | 'income' | 'expense' | 'warning'> = {
  awaitingClosure: 'warning',
  overBudget: 'expense',
  warning: 'warning',
  onTrack: 'primary',
  surplus: 'income',
  newPeriod: 'primary',
};

// ─── Props ───────────────────────────────────────────────────────

interface BudgetCardProps {
  readonly vm: BudgetViewModel;
  readonly onAssignTransaction?: (budgetId: string) => void;
  readonly onClosePeriod?: (budgetId: string) => void;
  readonly onEditBudget?: (budgetId: string) => void;
  readonly onDeleteBudget?: (budgetId: string) => void;
}

// ─── Component ───────────────────────────────────────────────────

export const BudgetCard = ({ vm, onAssignTransaction, onClosePeriod, onEditBudget, onDeleteBudget }: BudgetCardProps): React.JSX.Element => {
  const { t } = useTranslation();
  const {
    isExpanded,
    isAwaitingClosure,
    closePeriodLabel,
    handleToggleExpand,
    handleAssignTransaction,
    handleClosePeriod,
  } = useBudgetCard({
    budgetId: vm.id,
    status: vm.status,
    remaining: vm.remaining,
    onAssignTransaction,
    onClosePeriod,
  });

  return (
    <div className="flex flex-col rounded-lg border border-border bg-surface p-5 shadow-card">
      {/* Header: color dot + name + status badge */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: vm.color }}
          />
          <span className="text-sm font-semibold text-foreground">{vm.name}</span>
        </div>
        <div className="flex items-center gap-1">
          <Badge variant="soft" color={STATUS_BADGE_COLOR[vm.status]} dot={false}>
            {t(`budgets.status.${vm.statusLabel}`)}
          </Badge>
          {onEditBudget && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              icon={<Pencil size={14} />}
              onClick={() => onEditBudget(vm.id)}
              aria-label={t('budgets.form.titleEdit')}
              className="h-12 w-12 sm:h-9 sm:w-9"
            />
          )}
          {onDeleteBudget && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              icon={<Trash2 size={14} />}
              onClick={() => onDeleteBudget(vm.id)}
              aria-label={t('budgets.form.delete')}
              className="h-12 w-12 sm:h-9 sm:w-9"
            />
          )}
        </div>
      </div>

      {/* Period info */}
      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
        <span>{vm.periodLabel}</span>
        <span>·</span>
        <span>
          {isAwaitingClosure
            ? t('budgets.card.periodEnded')
            : t('budgets.card.daysRemaining', { count: vm.daysRemaining })}
        </span>
      </div>

      {/* Amounts row */}
      <div className="mt-4 flex items-baseline justify-between">
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">{t('budgets.card.spent')}</span>
          <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
            {formatAmount(vm.spent)} {vm.currency}
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-xs text-muted-foreground">{t('budgets.card.remaining')}</span>
          <span
            className={`font-mono text-sm font-semibold tabular-nums ${
              vm.remaining < 0 ? 'text-expense' : 'text-foreground'
            }`}
          >
            {formatAmount(vm.remaining)} {vm.currency}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3">
        <Progress
          value={vm.progressPercent}
          color={STATUS_PROGRESS_COLOR[vm.status]}
        />
      </div>

      {/* Subtitle */}
      <span className="mt-1.5 text-xs text-muted-foreground">
        {t('budgets.card.progressSubtitle', { spentPercent: vm.spentPercent, timePercent: vm.timePercent })}
      </span>

      {/* Closure banner */}
      {isAwaitingClosure && (
        <div className="mt-3 flex items-center justify-between rounded-md border border-warning/30 bg-warning/5 px-3 py-2">
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} className="text-warning" />
            <span className="text-xs font-medium text-warning">
              {t('budgets.card.periodEnded')}
            </span>
          </div>
          <button
            type="button"
            className="text-xs font-semibold text-primary transition-colors duration-150 hover:text-primary/80"
            onClick={handleClosePeriod}
          >
            {t(closePeriodLabel)}
          </button>
        </div>
      )}

      {/* Footer: assign + expand */}
      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <div className="flex items-center gap-2">
          {onAssignTransaction && !isAwaitingClosure && (
            <button
              type="button"
              className="flex items-center gap-1 text-xs font-medium text-primary transition-colors duration-150 hover:text-primary/80"
              onClick={handleAssignTransaction}
            >
              <Plus size={14} />
              {t('budgets.card.assignTransaction')}
            </button>
          )}
        </div>
        <button
          type="button"
          className="ml-auto flex items-center gap-1 text-xs text-muted-foreground transition-colors duration-150 hover:text-foreground"
          onClick={handleToggleExpand}
          aria-expanded={isExpanded}
        >
          {isExpanded ? t('budgets.card.hide') : t('budgets.card.details')}
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Expandable transactions list */}
      {isExpanded && (
        <BudgetTransactionList transactions={vm.transactions} currency={vm.currency} />
      )}
    </div>
  );
};
