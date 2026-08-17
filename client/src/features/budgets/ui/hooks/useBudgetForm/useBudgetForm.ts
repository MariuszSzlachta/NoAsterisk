import { useState } from 'react';

import { useBudgetsStore } from '#features/budgets/store/useBudgetsStore';
import type { BudgetPeriodRecord, BudgetRecord, BudgetType } from '#features/budgets/model/types';

// ─── Form State ──────────────────────────────────────────────────

interface BudgetFormValues {
  readonly budgetType: BudgetType;
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
  readonly initialBudgetType?: BudgetType;
}

interface UseBudgetFormReturn {
  readonly values: BudgetFormValues;
  readonly errors: BudgetFormErrors;
  readonly isSavings: boolean;
  readonly handleChange: (field: keyof BudgetFormValues, value: string) => void;
  readonly handleBudgetTypeChange: (type: BudgetType) => void;
  readonly handleSubmit: () => void;
  readonly isEditing: boolean;
}

// ─── Constants ───────────────────────────────────────────────────

const DEFAULT_VALUES: BudgetFormValues = {
  budgetType: 'standard',
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

export const useBudgetForm = ({ editBudget, onClose, initialBudgetType }: UseBudgetFormProps): UseBudgetFormReturn => {
  const createBudget = useBudgetsStore((s) => s.createBudget);
  const updateBudget = useBudgetsStore((s) => s.updateBudget);

  const isEditing = editBudget !== undefined;

  const initialValues: BudgetFormValues = editBudget
    ? {
        budgetType: editBudget.budgetType,
        name: editBudget.name,
        color: editBudget.color,
        limitAmount: String(editBudget.limitAmount),
        limitCurrency: editBudget.limitCurrency,
        periodType: editBudget.period?.type ?? 'monthly',
        dateFrom: editBudget.period?.type === 'custom' ? editBudget.period.dateFrom : '',
        dateTo: editBudget.period?.type === 'custom' ? editBudget.period.dateTo : '',
      }
    : { ...DEFAULT_VALUES, budgetType: initialBudgetType ?? 'standard' };

  const [values, setValues] = useState<BudgetFormValues>(initialValues);
  const [errors, setErrors] = useState<BudgetFormErrors>({});

  const isSavings = values.budgetType === 'savings';

  const handleChange = (field: keyof BudgetFormValues, value: string): void => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleBudgetTypeChange = (type: BudgetType): void => {
    setValues((prev) => ({ ...prev, budgetType: type }));
    setErrors({});
  };

  const validate = (): BudgetFormErrors => {
    const newErrors: Partial<Record<keyof BudgetFormErrors, string>> = {};

    if (!values.name.trim()) {
      newErrors.name = 'Nazwa jest wymagana';
    }

    if (isSavings) {
      // Savings: goal is optional, but if provided must be >= 0
      const amount = Number(values.limitAmount);
      if (values.limitAmount && (isNaN(amount) || amount < 0)) {
        newErrors.limitAmount = 'Podaj poprawną kwotę celu (>= 0)';
      }
    } else {
      // Standard: limit is required and must be > 0
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
    }

    return newErrors;
  };

  const buildPeriod = (): BudgetPeriodRecord | null => {
    if (isSavings) {
      return null;
    }
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

    const amount = values.limitAmount ? Number(values.limitAmount) : 0;

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
        budgetType: values.budgetType,
        color: values.color,
        limitAmount: amount,
        limitCurrency: values.limitCurrency,
        period: buildPeriod(),
      });
    }

    onClose();
  };

  return { values, errors, isSavings, handleChange, handleBudgetTypeChange, handleSubmit, isEditing };
};
