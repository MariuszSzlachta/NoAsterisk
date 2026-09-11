import { useTranslation } from 'react-i18next';

import { Button } from '#shared/ui/Button';
import { Input } from '#shared/ui/Input';
import { Modal } from '#shared/ui/Modal';

import type { BudgetRecord } from '#features/budgets/model/types/budget-record';
import type { BudgetType } from '#features/budgets/model/types/budget-type';
import { useBudgetForm } from '../hooks/useBudgetForm';
import { COLOR_PALETTE } from '../constants/color-palette';

// ─── Props ───────────────────────────────────────────────────────

interface BudgetFormModalProps {
  readonly isOpen: boolean;
  readonly editBudget?: BudgetRecord;
  readonly initialBudgetType?: BudgetType;
  readonly workspaceId?: string;
  readonly onClose: () => void;
}

// ─── Component ───────────────────────────────────────────────────

export const BudgetFormModal = ({ isOpen, editBudget, initialBudgetType, workspaceId = 'default', onClose }: BudgetFormModalProps): React.JSX.Element | null => {
  const { t } = useTranslation();
  const { values, errors, isSavings, handleChange, handleBudgetTypeChange, handleSubmit, isEditing } = useBudgetForm({
    editBudget,
    onClose,
    initialBudgetType,
    workspaceId,
  });

  if (!isOpen) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      title={isEditing ? t('budgets.form.titleEdit') : t('budgets.form.titleCreate')}
      closeLabel={t('budgets.form.close')}
      onClose={onClose}
      className="max-h-[calc(100dvh-2rem)] overflow-y-auto !p-5 sm:!p-6"
    >
        {/* Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="flex flex-col gap-4 [&_label]:text-sm"
        >
          {/* Budget type toggle (only when creating) */}
          {!isEditing && (
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-muted-foreground">{t('budgets.form.typeLabel')}</span>
              <div className="flex gap-2">
                {(['standard', 'savings'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={`min-h-12 flex-1 rounded-md px-3 py-3 text-sm font-medium transition-colors sm:min-h-0 sm:flex-none sm:rounded-full sm:py-1.5 sm:text-xs ${
                      values.budgetType === type
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-surface-2 text-muted-foreground hover:bg-surface-3'
                    }`}
                    onClick={() => handleBudgetTypeChange(type)}
                  >
                    {type === 'standard' ? t('budgets.form.typeStandard') : t('budgets.form.typeSavings')}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Name */}
          <Input
            label={t('budgets.form.nameLabel')}
            value={values.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder={t('budgets.form.namePlaceholder')}
            error={errors.name ? t(errors.name) : undefined}
          />

          {/* Color picker */}
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-muted-foreground">{t('budgets.form.colorLabel')}</span>
            <div className="grid grid-cols-5 justify-items-center gap-2 sm:flex sm:flex-wrap">
              {COLOR_PALETTE.map((color) => (
                <button
                  key={color}
                  type="button"
                    className={`h-10 w-10 rounded-full border-2 transition-all sm:h-6 sm:w-6 ${
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

          {/* Limit / Goal amount */}
          <Input
            label={isSavings ? t('budgets.form.goalLabel') : t('budgets.form.limitLabel', { currency: values.limitCurrency })}
            value={values.limitAmount}
            onChange={(e) => handleChange('limitAmount', e.target.value)}
            placeholder={isSavings ? t('budgets.form.goalPlaceholder') : t('budgets.form.limitPlaceholder')}
            type="number"
            error={errors.limitAmount ? t(errors.limitAmount) : undefined}
          />

          {/* Period selector (standard only) */}
          {!isSavings && (
            <>
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-muted-foreground">{t('budgets.form.periodLabel')}</span>
                <div className="flex gap-2">
                  {(['monthly', 'yearly', 'custom'] as const).map((period) => (
                    <button
                      key={period}
                      type="button"
                      className={`min-h-12 flex-1 rounded-md px-3 py-3 text-sm font-medium transition-colors sm:min-h-0 sm:flex-none sm:rounded-full sm:py-1.5 sm:text-xs ${
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
                      error={errors.dateFrom ? t(errors.dateFrom) : undefined}
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      label={t('budgets.form.dateTo')}
                      value={values.dateTo}
                      onChange={(e) => handleChange('dateTo', e.target.value)}
                      type="date"
                      error={errors.dateTo ? t(errors.dateTo) : undefined}
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Footer */}
          <div className="mt-2 flex gap-3">
            <Button
              variant="secondary"
              type="button"
              onClick={onClose}
              className="min-h-12 flex-1 px-4 sm:min-h-0 sm:flex-none"
            >
              {t('budgets.form.cancel')}
            </Button>
            <Button
              variant="primary"
              type="submit"
              className="min-h-12 flex-1 px-4 sm:min-h-0 sm:flex-none"
            >
              {isEditing ? t('budgets.form.save') : t('budgets.form.create')}
            </Button>
          </div>
        </form>
    </Modal>
  );
};
