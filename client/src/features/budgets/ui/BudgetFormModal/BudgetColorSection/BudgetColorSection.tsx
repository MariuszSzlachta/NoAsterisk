import { useTranslation } from 'react-i18next';

import { COLOR_PALETTE } from '#features/budgets/ui/constants/color-palette';
import type { useBudgetForm } from '#features/budgets/ui/hooks/useBudgetForm';
import type { useBudgetFormInteractions } from '#features/budgets/ui/hooks/useBudgetFormInteractions';
import { Button } from '#shared/ui/Button';

interface BudgetColorSectionProps {
  readonly form: Pick<ReturnType<typeof useBudgetForm>, 'values'>;
  readonly interactions: Pick<
    ReturnType<typeof useBudgetFormInteractions>,
    'createColorHandler'
  >;
}
export const BudgetColorSection = ({
  form,
  interactions,
}: BudgetColorSectionProps): React.JSX.Element => {
  const { t } = useTranslation();
  const { values } = form;
  const { createColorHandler } = interactions;
  return (
    <>
      {/* Color picker */}
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-muted-foreground">
          {t('budgets.form.colorLabel')}
        </span>
        <div className="grid grid-cols-5 justify-items-center gap-2 sm:flex sm:flex-wrap">
          {COLOR_PALETTE.map((color) => (
            <Button
              variant="ghost"
              key={color}
              type="button"
              className={`!h-10 !w-10 !rounded-full !border-2 !p-0 transition-all sm:!h-6 sm:!w-6 ${
                values.color === color
                  ? '!border-foreground scale-110'
                  : '!border-transparent hover:!border-border-strong'
              }`}
              style={{ backgroundColor: color }}
              onClick={createColorHandler(color)}
              aria-label={t('budgets.form.colorSelect', { color })}
            />
          ))}
        </div>
      </div>
    </>
  );
};
