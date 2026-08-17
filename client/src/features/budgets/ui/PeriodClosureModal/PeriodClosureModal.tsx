import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';

import { formatAmount } from '#shared/lib';
import { Button } from '#shared/ui/Button';
import { Select } from '#shared/ui/Select';

import type { BudgetViewModel } from '#features/budgets/model/types';
import { usePeriodClosure } from '../hooks/usePeriodClosure';

// ─── Props ───────────────────────────────────────────────────────

interface PeriodClosureModalProps {
  readonly budgetId: string;
  readonly vm: BudgetViewModel;
  readonly onClose: () => void;
}

// ─── Component ───────────────────────────────────────────────────

export const PeriodClosureModal = ({ budgetId, vm, onClose }: PeriodClosureModalProps): React.JSX.Element => {
  const { t } = useTranslation();
  const {
    selectedOption,
    selectedSavingsBudgetId,
    savingsBudgetOptions,
    hasSavingsBudgets,
    hasSurplus,
    isSubmitDisabled,
    handleOptionChange,
    handleSavingsSelect,
    handleSubmit,
  } = usePeriodClosure({ budgetId, vm, onClose });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" role="presentation">
      <div
        className="w-full max-w-md rounded-lg border border-border bg-surface p-6 shadow-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="closure-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 id="closure-modal-title" className="text-base font-semibold text-foreground">
            {t('budgets.closure.title', { name: vm.name })}
          </h2>
          <button
            type="button"
            className="text-muted-foreground transition-colors duration-150 hover:text-foreground"
            onClick={onClose}
            aria-label={t('budgets.closure.cancel')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Period label */}
        <p className="mt-1 text-sm text-muted-foreground">{vm.periodLabel}</p>

        {/* Summary */}
        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t('budgets.closure.limit')}</span>
            <span className="font-mono text-sm tabular-nums text-foreground">
              {formatAmount(vm.limit)} {vm.currency}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t('budgets.closure.spent')}</span>
            <span className="font-mono text-sm tabular-nums text-foreground">
              {formatAmount(vm.spent)} {vm.currency}
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-2">
            <span className="text-sm font-medium text-foreground">
              {vm.remaining > 0 ? t('budgets.closure.surplus') : t('budgets.closure.overspent')}
            </span>
            <span
              className={`font-mono text-sm font-semibold tabular-nums ${
                vm.remaining > 0 ? 'text-income' : 'text-expense'
              }`}
            >
              {formatAmount(Math.abs(vm.remaining))} {vm.currency}
            </span>
          </div>
        </div>

        {/* Rollover options (only when surplus exists) */}
        {hasSurplus ? (
          <div className="mt-5 space-y-3">
            {/* Carry forward */}
            <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3 transition-colors duration-150 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
              <input
                type="radio"
                name="rollover"
                className="mt-0.5 accent-primary"
                checked={selectedOption === 'carry_forward'}
                onChange={() => handleOptionChange('carry_forward')}
              />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">
                  {t('budgets.closure.optionCarryForward')}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t('budgets.closure.optionCarryForwardHint', {
                    currentLimit: formatAmount(vm.limit),
                    surplus: formatAmount(vm.remaining),
                    newLimit: formatAmount(vm.limit + vm.remaining),
                  })}
                </span>
              </div>
            </label>

            {/* Transfer to savings */}
            <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3 transition-colors duration-150 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
              <input
                type="radio"
                name="rollover"
                className="mt-0.5 accent-primary"
                checked={selectedOption === 'savings'}
                onChange={() => handleOptionChange('savings')}
                disabled={!hasSavingsBudgets}
              />
              <div className="flex flex-1 flex-col gap-2">
                <span className={`text-sm font-medium ${hasSavingsBudgets ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {t('budgets.closure.optionSavings')}
                </span>
                {hasSavingsBudgets ? (
                  selectedOption === 'savings' && (
                    <Select
                      options={savingsBudgetOptions}
                      value={selectedSavingsBudgetId}
                      onChange={handleSavingsSelect}
                      placeholder={t('budgets.closure.optionSavingsSelect')}
                    />
                  )
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {t('budgets.closure.optionSavingsEmpty')}
                  </span>
                )}
              </div>
            </label>

            {/* Discard */}
            <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3 transition-colors duration-150 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
              <input
                type="radio"
                name="rollover"
                className="mt-0.5 accent-primary"
                checked={selectedOption === 'discard'}
                onChange={() => handleOptionChange('discard')}
              />
              <span className="text-sm font-medium text-foreground">
                {t('budgets.closure.optionDiscard')}
              </span>
            </label>
          </div>
        ) : (
          <p className="mt-5 text-sm text-muted-foreground">
            {t('budgets.closure.noSurplus')}
          </p>
        )}

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            {t('budgets.closure.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitDisabled}>
            {t('budgets.closure.submit')}
          </Button>
        </div>
      </div>
    </div>
  );
};
