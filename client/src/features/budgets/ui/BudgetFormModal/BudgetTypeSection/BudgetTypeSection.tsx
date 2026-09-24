import { useTranslation } from 'react-i18next';

import { budgetTypeOptions } from '#features/budgets/ui/constants/budgetTypeOptions';
import type { useBudgetForm } from '#features/budgets/ui/hooks/useBudgetForm';
import type { useBudgetFormInteractions } from '#features/budgets/ui/hooks/useBudgetFormInteractions';
import { Button } from '#shared/ui/Button';

interface BudgetTypeSectionProps {
  readonly form: Pick<ReturnType<typeof useBudgetForm>, 'values' | 'isEditing'>;
  readonly interactions: Pick<
    ReturnType<typeof useBudgetFormInteractions>,
    'createBudgetTypeHandler'
  >;
}
export const BudgetTypeSection = ({
  form,
  interactions,
}: BudgetTypeSectionProps): React.JSX.Element => {
  const { t } = useTranslation();
  const { values, isEditing } = form;
  const { createBudgetTypeHandler } = interactions;
  return (
    <>
      {/* Budget type toggle (only when creating) */}
      {!isEditing && (
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-muted-foreground">
            {t('budgets.form.typeLabel')}
          </span>
          <div className="flex gap-2">
            {budgetTypeOptions.map((type) => (
              <Button
                variant="ghost"
                key={type}
                type="button"
                className={`min-h-12 flex-1 !rounded-md !px-3 !py-3 text-sm font-medium transition-colors sm:min-h-0 sm:flex-none sm:!rounded-full sm:!py-1.5 sm:text-xs ${
                  values.budgetType === type
                    ? '!bg-primary !text-primary-foreground'
                    : '!bg-surface-2 !text-muted-foreground hover:!bg-surface-3'
                }`}
                onClick={createBudgetTypeHandler(type)}
              >
                {type === 'standard'
                  ? t('budgets.form.typeStandard')
                  : t('budgets.form.typeSavings')}
              </Button>
            ))}
          </div>
        </div>
      )}
    </>
  );
};
