// ═══════════════════════════════════════════════════════════════════
// Transactions Feature — useTransactionForm Hook
// ═══════════════════════════════════════════════════════════════════

import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useToast } from '#shared/hooks/useToast';

import type {
  CreateTransactionErrors,
  CreateTransactionFormValues,
} from '#features/transactions/model/create-transaction/types';
import {
  hasErrors,
  validateCreateTransaction,
} from '#features/transactions/model/create-transaction/validate-transaction';
import { useTransactionsStore } from '#features/transactions/store/useTransactionsStore';

// ─── Types ───────────────────────────────────────────────────────

interface UseTransactionFormResult {
  readonly formValues: CreateTransactionFormValues;
  readonly errors: CreateTransactionErrors;
  readonly handleChange: <TKey extends keyof CreateTransactionFormValues>(
    field: TKey,
    value: CreateTransactionFormValues[TKey],
  ) => void;
  readonly handleSubmit: () => void;
}

// ─── Constants ───────────────────────────────────────────────────

const getInitialValues = (): CreateTransactionFormValues => ({
  title: '',
  amount: '',
  date: new Date().toISOString().slice(0, 10),
  type: 'expense',
  categoryId: '',
});

// ─── Hook ────────────────────────────────────────────────────────

export const useTransactionForm = (onClose: () => void): UseTransactionFormResult => {
  const { t } = useTranslation();
  const addTransaction = useTransactionsStore((s) => s.addTransaction);
  const addToast = useToast((s) => s.addToast);

  const [formValues, setFormValues] = useState<CreateTransactionFormValues>(getInitialValues);
  const [errors, setErrors] = useState<CreateTransactionErrors>({});

  const handleChange = <TKey extends keyof CreateTransactionFormValues>(
    field: TKey,
    value: CreateTransactionFormValues[TKey],
  ): void => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
    // Clear error for field on change
    if (errors[field as keyof CreateTransactionErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = (): void => {
    const validationErrors = validateCreateTransaction(formValues);

    if (hasErrors(validationErrors)) {
      setErrors(validationErrors);
      return;
    }

    addTransaction(formValues);
    addToast(t('transactions.form.successToast'), 'success');
    setFormValues(getInitialValues());
    setErrors({});
    onClose();
  };

  return {
    formValues,
    errors,
    handleChange,
    handleSubmit,
  };
};
