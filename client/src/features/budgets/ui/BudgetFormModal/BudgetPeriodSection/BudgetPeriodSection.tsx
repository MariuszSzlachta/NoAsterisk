import { useTranslation } from 'react-i18next';

import { budgetPeriodOptions } from '#features/budgets/ui/constants/budgetPeriodOptions';
import type { useBudgetForm } from '#features/budgets/ui/hooks/useBudgetForm';
import type { useBudgetFormInteractions } from '#features/budgets/ui/hooks/useBudgetFormInteractions';
import { Button } from '#shared/ui/Button';
import { Input } from '#shared/ui/Input';

interface BudgetPeriodSectionProps {
  readonly form: Pick<
    ReturnType<typeof useBudgetForm>,
    'values' | 'errors' | 'isSavings'
  >;
  readonly interactions: Pick<
    ReturnType<typeof useBudgetFormInteractions>,
    'createPeriodHandler' | 'handleDateFromChange' | 'handleDateToChange'
  >;
}
export const BudgetPeriodSection = ({
  form,
  interactions,
}: BudgetPeriodSectionProps): React.JSX.Element => {
  const { t } = useTranslation();
  const { values, errors, isSavings } = form;
  const { createPeriodHandler, handleDateFromChange, handleDateToChange } =
    interactions;
  return (
    <>
      {/* Period selector (standard only) */}
      {!isSavings && (
        <>
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-muted-foreground">
              {t('budgets.form.periodLabel')}
            </span>
            <div className="flex gap-2">
              {budgetPeriodOptions.map((period) => (
                <Button
                  variant="ghost"
                  key={period}
                  type="button"
                  className={`min-h-12 flex-1 !rounded-md !px-3 !py-3 text-sm font-medium transition-colors sm:min-h-0 sm:flex-none sm:!rounded-full sm:!py-1.5 sm:text-xs ${
                    values.periodType === period
                      ? '!bg-primary !text-primary-foreground'
                      : '!bg-surface-2 !text-muted-foreground hover:!bg-surface-3'
                  }`}
                  onClick={createPeriodHandler(period)}
                >
                  {period === 'monthly'
                    ? t('budgets.form.periodMonthly')
                    : period === 'yearly'
                      ? t('budgets.form.periodYearly')
                      : t('budgets.form.periodCustom')}
                </Button>
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
                  onChange={handleDateFromChange}
                  type="date"
                  error={errors.dateFrom ? t(errors.dateFrom) : undefined}
                />
              </div>
              <div className="flex-1">
                <Input
                  label={t('budgets.form.dateTo')}
                  value={values.dateTo}
                  onChange={handleDateToChange}
                  type="date"
                  error={errors.dateTo ? t(errors.dateTo) : undefined}
                />
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
};
