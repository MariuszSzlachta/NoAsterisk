// ═══════════════════════════════════════════════════════════════════
// Admin Rules — RuleFormModal Component (inline card form)
// ═══════════════════════════════════════════════════════════════════

import { useTranslation } from 'react-i18next';

import { CATEGORY_SELECT_OPTIONS } from '#entities/category';
import { isMatcherType } from '#features/admin-rules/model';
import type { RuleRecord } from '#features/admin-rules/model/types';
import { useRuleForm } from '#features/admin-rules/ui/hooks/useRuleForm';
import { Button } from '#shared/ui/Button';
import { Card } from '#shared/ui/Card';
import { Input } from '#shared/ui/Input';
import { Select } from '#shared/ui/Select';
import type { SelectOption } from '#shared/ui/Select';

// ─── Props ───────────────────────────────────────────────────────

interface RuleFormModalProps {
  readonly editingRule?: RuleRecord;
  readonly onClose: () => void;
}

// ─── Component ───────────────────────────────────────────────────

export const RuleFormModal = ({
  editingRule,
  onClose,
}: RuleFormModalProps): React.JSX.Element => {
  const { t } = useTranslation();
  const { formValues, errors, isEditing, handleFieldChange, handleSubmit, handleCancel } =
    useRuleForm(editingRule, onClose);

  const matcherOptions: readonly SelectOption[] = [
    { value: 'Contains', label: t('rules.form.matcherContains') },
    { value: 'Exact', label: t('rules.form.matcherExact') },
  ];

  return (
    <Card className="mb-4">
      <h2 className="mb-4 text-sm font-semibold text-foreground">
        {isEditing ? t('rules.form.titleEdit') : t('rules.form.titleAdd')}
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          label={t('rules.form.keyword')}
          value={formValues.keyword}
          onChange={(e) => handleFieldChange('keyword', e.target.value)}
          error={errors.keyword}
          placeholder={t('rules.form.keywordPlaceholder')}
        />
        <div
          className="flex w-full flex-col gap-1.5"
          role="group"
          aria-label={t('rules.form.matcher')}
        >
          <label htmlFor="rule-matcher-type" className="text-xs font-medium text-muted-foreground">
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
          <label htmlFor="rule-category" className="text-xs font-medium text-muted-foreground">
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
              {errors.categoryId}
            </p>
          )}
        </div>
        <Input
          label={t('rules.form.priority')}
          type="number"
          value={String(formValues.priority)}
          onChange={(e) =>
            handleFieldChange('priority', Math.max(1, Number(e.target.value) || 1))
          }
          placeholder="1"
        />
      </div>
      <div className="mt-4 flex items-center gap-2">
        <Button onClick={handleSubmit}>
          {isEditing ? t('rules.form.save') : t('rules.form.add')}
        </Button>
        <Button variant="ghost" onClick={handleCancel}>
          {t('rules.form.cancel')}
        </Button>
      </div>
    </Card>
  );
};
