// ═══════════════════════════════════════════════════════════════════
// Admin Rules — RuleFormModal Component (inline card form)
// ═══════════════════════════════════════════════════════════════════

import { CATEGORY_SELECT_OPTIONS } from '#entities/category';
import { isMatcherType } from '#features/admin-rules/model';
import type { RuleRecord } from '#features/admin-rules/model/types';
import { useRuleForm } from '#features/admin-rules/ui/hooks/useRuleForm';
import { Button } from '#shared/ui/Button';
import { Card } from '#shared/ui/Card';
import { Input } from '#shared/ui/Input';
import { Select } from '#shared/ui/Select';

// ─── Props ───────────────────────────────────────────────────────

interface RuleFormModalProps {
  readonly editingRule?: RuleRecord;
  readonly onClose: () => void;
}

// ─── Constants ───────────────────────────────────────────────────

const MATCHER_OPTIONS: readonly SelectOption[] = [
  { value: 'Contains', label: 'Zawiera' },
  { value: 'Exact', label: 'Dokładnie' },
];

// ─── Component ───────────────────────────────────────────────────

export const RuleFormModal = ({
  editingRule,
  onClose,
}: RuleFormModalProps): React.JSX.Element => {
  const { formValues, errors, isEditing, handleFieldChange, handleSubmit, handleCancel } =
    useRuleForm(editingRule, onClose);

  return (
    <Card className="mb-4">
      <h2 className="mb-4 text-sm font-semibold text-foreground">
        {isEditing ? 'Edytuj regułę' : 'Dodaj regułę'}
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          label="Słowo kluczowe"
          value={formValues.keyword}
          onChange={(e) => handleFieldChange('keyword', e.target.value)}
          error={errors.keyword}
          placeholder="np. BIEDRONKA"
        />
        <div
          className="flex w-full flex-col gap-1.5"
          role="group"
          aria-label="Dopasowanie"
        >
          <label htmlFor="rule-matcher-type" className="text-xs font-medium text-muted-foreground">
            Dopasowanie
          </label>
          <Select
            id="rule-matcher-type"
            options={MATCHER_OPTIONS}
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
          aria-label="Kategoria"
        >
          <label htmlFor="rule-category" className="text-xs font-medium text-muted-foreground">
            Kategoria
          </label>
          <Select
            id="rule-category"
            options={CATEGORY_SELECT_OPTIONS}
            value={formValues.categoryId}
            onChange={(value) => handleFieldChange('categoryId', value)}
            placeholder="Wybierz kategorię..."
          />
          {errors.categoryId && (
            <p className="text-xs text-expense" role="alert">
              {errors.categoryId}
            </p>
          )}
        </div>
        <Input
          label="Priorytet"
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
          {isEditing ? 'Zapisz' : 'Dodaj'}
        </Button>
        <Button variant="ghost" onClick={handleCancel}>
          Anuluj
        </Button>
      </div>
    </Card>
  );
};
