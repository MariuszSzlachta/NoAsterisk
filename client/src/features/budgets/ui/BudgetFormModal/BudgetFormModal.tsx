import { useTranslation } from 'react-i18next';

import type { BudgetRecord } from '#features/budgets/model/types/budget-record';
import type { BudgetType } from '#features/budgets/model/types/budget-type';
import { BudgetColorSection } from '#features/budgets/ui/BudgetFormModal/BudgetColorSection';
import { BudgetFormFooter } from '#features/budgets/ui/BudgetFormModal/BudgetFormFooter';
import { BudgetPeriodSection } from '#features/budgets/ui/BudgetFormModal/BudgetPeriodSection';
import { BudgetTypeSection } from '#features/budgets/ui/BudgetFormModal/BudgetTypeSection';
import { useBudgetForm } from '#features/budgets/ui/hooks/useBudgetForm';
import { useBudgetFormInteractions } from '#features/budgets/ui/hooks/useBudgetFormInteractions';
import { Input } from '#shared/ui/Input';
import { Modal } from '#shared/ui/Modal';

// ─── Props ───────────────────────────────────────────────────────

interface BudgetFormModalProps {
  readonly isOpen: boolean;
  readonly editBudget?: BudgetRecord;
  readonly initialBudgetType?: BudgetType;
  readonly workspaceId?: string;
  readonly onClose: () => void;
}

// ─── Component ───────────────────────────────────────────────────

export const BudgetFormModal = ({
  isOpen,
  editBudget,
  initialBudgetType,
  workspaceId = 'default',
  onClose,
}: BudgetFormModalProps): React.JSX.Element | null => {
  const { t } = useTranslation();
  const form = useBudgetForm({
    editBudget,
    onClose,
    initialBudgetType,
    workspaceId,
  });
  const { values, errors, isSavings, isEditing } = form;
  const interactions = useBudgetFormInteractions(form);
  const { handleFormSubmit, handleNameChange, handleLimitAmountChange } =
    interactions;

  if (!isOpen) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      title={
        isEditing ? t('budgets.form.titleEdit') : t('budgets.form.titleCreate')
      }
      closeLabel={t('budgets.form.close')}
      onClose={onClose}
      className="max-h-[calc(100dvh-2rem)] overflow-y-auto !p-5 sm:!p-6"
    >
      {/* Form */}
      <form
        onSubmit={handleFormSubmit}
        className="flex flex-col gap-4 [&_label]:text-sm"
      >
        <BudgetTypeSection form={form} interactions={interactions} />
        {/* Name */}
        <Input
          label={t('budgets.form.nameLabel')}
          value={values.name}
          onChange={handleNameChange}
          placeholder={t('budgets.form.namePlaceholder')}
          error={errors.name ? t(errors.name) : undefined}
        />

        <BudgetColorSection form={form} interactions={interactions} />
        {/* Limit / Goal amount */}
        <Input
          label={
            isSavings
              ? t('budgets.form.goalLabel')
              : t('budgets.form.limitLabel', { currency: values.limitCurrency })
          }
          value={values.limitAmount}
          onChange={handleLimitAmountChange}
          placeholder={
            isSavings
              ? t('budgets.form.goalPlaceholder')
              : t('budgets.form.limitPlaceholder')
          }
          type="number"
          error={errors.limitAmount ? t(errors.limitAmount) : undefined}
        />

        <BudgetPeriodSection form={form} interactions={interactions} />
        <BudgetFormFooter form={form} onClose={onClose} />
      </form>
    </Modal>
  );
};
