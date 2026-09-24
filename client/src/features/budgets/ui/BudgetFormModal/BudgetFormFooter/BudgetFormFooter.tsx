import { useTranslation } from 'react-i18next';

import type { useBudgetForm } from '#features/budgets/ui/hooks/useBudgetForm';
import { Button } from '#shared/ui/Button';

interface BudgetFormFooterProps {
  readonly form: Pick<ReturnType<typeof useBudgetForm>, 'isEditing'>;
  readonly onClose: () => void;
}
export const BudgetFormFooter = ({
  form,
  onClose,
}: BudgetFormFooterProps): React.JSX.Element => {
  const { t } = useTranslation();
  const { isEditing } = form;

  return (
    <>
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
    </>
  );
};
