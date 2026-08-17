import { useState } from 'react';

import { useBudgetsStore } from '#features/budgets/store/useBudgetsStore';
import type { BudgetPeriodRecord, BudgetRecord } from '#features/budgets/model/types';

// ─── Form State ──────────────────────────────────────────────────

interface BudgetFormValues {
  readonly name: string;
  readonly color: string;
  readonly limitAmount: string;
  readonly limitCurrency: string;
  readonly periodType: 'monthly' | 'yearly' | 'custom';
  readonly dateFrom: string;
  readonly dateTo: string;
}

interface BudgetFormErrors {
  readonly name?: string;
  readonly limitAmount?: string;
  readonly dateFrom?: string;
  readonly dateTo?: string;
}

interface UseBudgetFormProps {
  readonly editBudget?: BudgetRecord;
  readonly onClose: () => void;
}

interface UseBudgetFormReturn {
  readonly values: BudgetFormValues;
  readonly errors: BudgetFormErrors;
  readonly handleChange: (field: keyof BudgetFormValues, value: string) => void;
  readonly handleSubmit: () => void;
  readonly isEditing: boolean;
}

// ─── Constants ───────────────────────────────────────────────────

const DEFAULT_VALUES: BudgetFormValues = {
  name: '',
  color: '#3b82f6',
  limitAmount: '',
  limitCurrency: 'PLN',
  periodType: 'monthly',
  dateFrom: '',
  dateTo: '',
};

const COLOR_PALETTE = [
  '#34d399', '#60a5fa', '#a78bfa', '#fbbf24', '#94a3b8', '#fb7185',
  '#3b82f6', '#f59e0b', '#10b981', '#8b5cf6',
] as const;

export { COLOR_PALETTE };

// ─── Hook ────────────────────────────────────────────────────────

export const useBudgetForm = ({ editBudget, onClose }: UseBudgetFormProps): UseBudgetFormReturn => {
  const createBudget = useBudgetsStore((s) => s.createBudget);
  const updateBudget = useBudgetsStore((s) => s.updateBudget);

  const isEditing = editBudget !== undefined;

  const initialValues: BudgetFormValues = editBudget
    ? {
        name: editBudget.name,
        color: editBudget.color,
        limitAmount: String(editBudget.limitAmount),
        limitCurrency: editBudget.limitCurrency,
        periodType: editBudget.period.type,
        dateFrom: editBudget.period.type === 'custom' ? editBudget.period.dateFrom : '',
        dateTo: editBudget.period.type === 'custom' ? editBudget.period.dateTo : '',
      }
    : DEFAULT_VALUES;

  const [values, setValues] = useState<BudgetFormValues>(initialValues);
  const [errors, setErrors] = useState<BudgetFormErrors>({});

  const handleChange = (field: keyof BudgetFormValues, value: string): void => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): BudgetFormErrors => {
    const newErrors: BudgetFormErrors = {};

    if (!values.name.trim()) {
      newErrors.name = 'Nazwa jest wymagana';
    }

    const amount = Number(values.limitAmount);
    if (!values.limitAmount || isNaN(amount) || amount <= 0) {
      newErrors.limitAmount = 'Podaj poprawną kwotę limitu (> 0)';
    }

    if (values.periodType === 'custom') {
      if (!values.dateFrom) {
        newErrors.dateFrom = 'Data początkowa jest wymagana';
      }
      if (!values.dateTo) {
        newErrors.dateTo = 'Data końcowa jest wymagana';
      }
      if (values.dateFrom && values.dateTo && values.dateFrom >= values.dateTo) {
        newErrors.dateTo = 'Data końcowa musi być po początkowej';
      }
    }

    return newErrors;
  };

  const buildPeriod = (): BudgetPeriodRecord => {
    switch (values.periodType) {
      case 'monthly':
        return { type: 'monthly' };
      case 'yearly':
        return { type: 'yearly' };
      case 'custom':
        return { type: 'custom', dateFrom: values.dateFrom, dateTo: values.dateTo };
    }
  };

  const handleSubmit = (): void => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const amount = Number(values.limitAmount);

    if (isEditing && editBudget) {
      updateBudget(editBudget.id, {
        name: values.name,
        color: values.color,
        limitAmount: amount,
        limitCurrency: values.limitCurrency,
        period: buildPeriod(),
      });
    } else {
      createBudget({
        name: values.name,
        color: values.color,
        limitAmount: amount,
        limitCurrency: values.limitCurrency,
        period: buildPeriod(),
      });
    }

    onClose();
  };

  return { values, errors, handleChange, handleSubmit, isEditing };
};
