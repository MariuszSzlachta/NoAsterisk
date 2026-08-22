// ═══════════════════════════════════════════════════════════════════
// Transactions Feature — TransactionFormModal Component
// ═══════════════════════════════════════════════════════════════════

import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { CATEGORY_SELECT_OPTIONS } from '#entities/category';
import { Button } from '#shared/ui/Button';
import { Input } from '#shared/ui/Input';
import { Select } from '#shared/ui/Select';

import { useTransactionForm } from '../hooks/useTransactionForm';

// ─── Constants ───────────────────────────────────────────────────

const TYPE_OPTIONS = [
  { value: 'expense', labelKey: 'transactions.form.typeExpense' },
  { value: 'income', labelKey: 'transactions.form.typeIncome' },
] as const;

// ─── Props ───────────────────────────────────────────────────────

interface TransactionFormModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

// ─── Component ───────────────────────────────────────────────────

export const TransactionFormModal = ({
  isOpen,
  onClose,
}: TransactionFormModalProps): React.JSX.Element | null => {
  const { t } = useTranslation();
  const { formValues, errors, handleChange, handleSubmit } = useTransactionForm(onClose);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="transaction-form-title"
    >
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
        aria-label={t('common.close')}
        tabIndex={-1}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-lg border border-border bg-surface p-6 shadow-card">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 id="transaction-form-title" className="text-lg font-semibold text-foreground">
            {t('transactions.form.title')}
          </h2>
          <button
            type="button"
            className="rounded-sm p-1 text-muted-foreground transition-colors hover:text-foreground"
            onClick={onClose}
            aria-label={t('common.close')}
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
          {/* Title */}
          <Input
            label={t('transactions.form.titleLabel')}
            value={formValues.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder={t('transactions.form.titlePlaceholder')}
            error={errors.title}
          />

          {/* Amount */}
          <Input
            label={t('transactions.form.amountLabel')}
            type="number"
            value={formValues.amount}
            onChange={(e) => handleChange('amount', e.target.value)}
            placeholder={t('transactions.form.amountPlaceholder')}
            error={errors.amount}
            step="0.01"
            min="0"
          />

          {/* Date */}
          <Input
            label={t('transactions.form.dateLabel')}
            type="date"
            value={formValues.date}
            onChange={(e) => handleChange('date', e.target.value)}
            error={errors.date}
          />

          {/* Type radio buttons */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              {t('transactions.form.typeLabel')}
            </span>
            <div className="flex gap-2">
              {TYPE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    formValues.type === option.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-surface-2 text-muted-foreground hover:bg-surface-3'
                  }`}
                  onClick={() => handleChange('type', option.value)}
                  aria-pressed={formValues.type === option.value}
                >
                  {t(option.labelKey)}
                </button>
              ))}
            </div>
            {errors.type && (
              <p className="text-xs text-expense" role="alert">
                {errors.type}
              </p>
            )}
          </div>

          {/* Category (optional) */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="transaction-category"
              className="text-xs font-medium text-muted-foreground"
            >
              {t('transactions.form.categoryLabel')}
            </label>
            <Select
              id="transaction-category"
              options={CATEGORY_SELECT_OPTIONS}
              value={formValues.categoryId}
              onChange={(value) => handleChange('categoryId', value)}
              placeholder={t('transactions.form.categoryPlaceholder')}
            />
          </div>

          {/* Footer */}
          <div className="mt-2 flex justify-end gap-3">
            <Button variant="secondary" type="button" onClick={onClose}>
              {t('transactions.form.cancel')}
            </Button>
            <Button variant="primary" type="submit">
              {t('transactions.form.submit')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
