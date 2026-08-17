import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';

import { Button } from '#shared/ui/Button';
import { Input } from '#shared/ui/Input';

import type { BudgetRecord } from '#features/budgets/model/types';
import { useBudgetForm, COLOR_PALETTE } from '../hooks/useBudgetForm';

// ─── Props ───────────────────────────────────────────────────────

interface BudgetFormModalProps {
  /**
   * Parent MUST use `key={editBudget?.id ?? 'create'}` to ensure
   * form state resets when switching between create/edit modes.
   */
  readonly isOpen: boolean;
  readonly editBudget?: BudgetRecord;
  readonly onClose: () => void;
}

// ─── Component ───────────────────────────────────────────────────

export const BudgetFormModal = ({ isOpen, editBudget, onClose }: BudgetFormModalProps): React.JSX.Element | null => {
  const { t } = useTranslation();
  const { values, errors, handleChange, handleSubmit, isEditing } = useBudgetForm({
    editBudget,
    onClose,
  });

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="budget-form-title"
    >
      {/* Backdrop — click to close */}
      <button
        type="button"
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
        aria-label={t('budgets.form.closeModal')}
        tabIndex={-1}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-lg border border-border bg-surface p-6 shadow-card">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 id="budget-form-title" className="text-lg font-semibold text-foreground">
            {isEditing ? t('budgets.form.titleEdit') : t('budgets.form.titleCreate')}
          </h2>
          <button
            type="button"
            className="rounded-sm p-1 text-muted-foreground transition-colors hover:text-foreground"
            onClick={onClose}
            aria-label={t('budgets.form.close')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="flex flex-col gap-4"
        >
          {/* Name */}
          <Input
            label={t('budgets.form.nameLabel')}
            value={values.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder={t('budgets.form.namePlaceholder')}
            error={errors.name}
          />

          {/* Color picker */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">{t('budgets.form.colorLabel')}</span>
            <div className="flex flex-wrap gap-2">
              {COLOR_PALETTE.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`h-6 w-6 rounded-full border-2 transition-all ${
                    values.color === color
                      ? 'border-foreground scale-110'
                      : 'border-transparent hover:border-border-strong'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => handleChange('color', color)}
                  aria-label={t('budgets.form.colorSelect', { color })}
                />
              ))}
            </div>
          </div>

          {/* Limit amount */}
          <Input
            label={t('budgets.form.limitLabel', { currency: values.limitCurrency })}
            value={values.limitAmount}
            onChange={(e) => handleChange('limitAmount', e.target.value)}
            placeholder={t('budgets.form.limitPlaceholder')}
            type="number"
            error={errors.limitAmount}
          />

          {/* Period selector */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">{t('budgets.form.periodLabel')}</span>
            <div className="flex gap-2">
              {(['monthly', 'yearly', 'custom'] as const).map((period) => (
                <button
                  key={period}
                  type="button"
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    values.periodType === period
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-surface-2 text-muted-foreground hover:bg-surface-3'
                  }`}
                  onClick={() => handleChange('periodType', period)}
                >
                  {period === 'monthly' ? t('budgets.form.periodMonthly') : period === 'yearly' ? t('budgets.form.periodYearly') : t('budgets.form.periodCustom')}
                </button>
              ))}
            </div>
          </div>

          {/* Custom date range */}
          {values.periodType === 'custom' && (
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  label={t('budgets.form.dateFrom')}
                  value={values.dateFrom}
                  onChange={(e) => handleChange('dateFrom', e.target.value)}
                  type="date"
                  error={errors.dateFrom}
                />
              </div>
              <div className="flex-1">
                <Input
                  label={t('budgets.form.dateTo')}
                  value={values.dateTo}
                  onChange={(e) => handleChange('dateTo', e.target.value)}
                  type="date"
                  error={errors.dateTo}
                />
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-2 flex justify-end gap-3">
            <Button variant="secondary" type="button" onClick={onClose}>
              {t('budgets.form.cancel')}
            </Button>
            <Button variant="primary" type="submit">
              {isEditing ? t('budgets.form.save') : t('budgets.form.create')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
