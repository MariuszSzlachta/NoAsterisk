import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { isMatcherType } from '#features/admin-rules/model';
import type { RuleRecord } from '#features/admin-rules/model/types';
import { useRuleForm } from '#features/admin-rules/ui/hooks/useRuleForm';
import { CATEGORY_SELECT_OPTIONS } from '#entities/category';
import { Button } from '#shared/ui/Button';
import { Input } from '#shared/ui/Input';
import { Modal } from '#shared/ui/Modal';
import { Select, type SelectOption } from '#shared/ui/Select';

interface RuleFormModalProps {
  readonly isOpen: boolean;
  readonly editingRule?: RuleRecord;
  readonly onClose: () => void;
}

export const RuleFormModal = ({
  isOpen,
  editingRule,
  onClose,
}: RuleFormModalProps): React.JSX.Element | null => {
  const { t } = useTranslation();
  const {
    formValues,
    errors,
    isEditing,
    handleFieldChange,
    handleSubmit,
    handleCancel,
  } = useRuleForm(editingRule, onClose);

  if (!isOpen) {
    return null;
  }

  const matcherOptions: readonly SelectOption[] = [
    { value: 'Contains', label: t('rules.form.matcherContains') },
    { value: 'Exact', label: t('rules.form.matcherExact') },
  ];

  const handleFormSubmit = (e: FormEvent): void => {
    e.preventDefault();
    handleSubmit();
  };

  return (
    <Modal
      isOpen={isOpen}
      title={isEditing ? t('rules.form.titleEdit') : t('rules.form.titleAdd')}
      closeLabel={t('common.close')}
      onClose={onClose}
      className="max-h-[calc(100dvh-2rem)] overflow-y-auto !p-5 sm:!p-6"
    >
      <form
        onSubmit={handleFormSubmit}
        noValidate
        className="flex flex-col gap-4 [&_label]:text-sm"
      >
        <Input
          label={t('rules.form.keyword')}
          value={formValues.keyword}
          onChange={(e) => handleFieldChange('keyword', e.target.value)}
          error={errors.keyword ? t(errors.keyword) : undefined}
          placeholder={t('rules.form.keywordPlaceholder')}
        />
        <div
          className="flex w-full flex-col gap-1.5"
          role="group"
          aria-label={t('rules.form.matcher')}
        >
          <label
            htmlFor="rule-matcher-type"
            className="text-xs font-medium text-muted-foreground"
          >
            {t('rules.form.matcher')}
          </label>
          <Select
            id="rule-matcher-type"
            options={matcherOptions}
            value={formValues.matcherType}
            onChange={(value) => {
              if (isMatcherType(value)) {
                handleFieldChange('matcherType', value);
              }
            }}
          />
        </div>
        <div
          className="flex w-full flex-col gap-1.5"
          role="group"
          aria-label={t('rules.form.category')}
        >
          <label
            htmlFor="rule-category"
            className="text-xs font-medium text-muted-foreground"
          >
            {t('rules.form.category')}
          </label>
          <Select
            id="rule-category"
            options={CATEGORY_SELECT_OPTIONS}
            value={formValues.categoryId}
            onChange={(value) => handleFieldChange('categoryId', value)}
            placeholder={t('rules.form.categoryPlaceholder')}
          />
          {errors.categoryId && (
            <p className="text-xs text-expense" role="alert">
              {t(errors.categoryId)}
            </p>
          )}
        </div>
        <Input
          label={t('rules.form.priority')}
          type="number"
          min={1}
          value={formValues.priority === '' ? '' : String(formValues.priority)}
          onChange={(e) => {
            const value = e.target.value;
            handleFieldChange(
              'priority',
              value === '' ? '' : Math.max(1, Number(value) || 1),
            );
          }}
          placeholder="1"
        />
        <div className="mt-2 flex gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={handleCancel}
            className="min-h-12 flex-1 px-4 sm:min-h-0 sm:flex-none"
          >
            {t('rules.form.cancel')}
          </Button>
          <Button
            type="submit"
            className="min-h-12 flex-1 px-4 sm:min-h-0 sm:flex-none"
          >
            {isEditing ? t('rules.form.save') : t('rules.form.add')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
