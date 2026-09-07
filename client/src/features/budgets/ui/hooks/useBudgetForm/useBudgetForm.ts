import { useEffect, useState } from 'react';

import { useBudgetsStore } from '#features/budgets/store/useBudgetsStore';
import type { BudgetPeriodRecord } from '#features/budgets/model/types/budget-period-record';
import type { BudgetRecord } from '#features/budgets/model/types/budget-record';
import type { BudgetType } from '#features/budgets/model/types/budget-type';

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
  readonly workspaceId: string;
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

export const COLOR_PALETTE = [
  '#3b82f6',
  '#22c55e',
  '#f59e0b',
  '#ef4444',
  '#a855f7',
  '#06b6d4',
] as const;

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

// ─── Validation Error Codes ──────────────────────────────────────

const ERROR_CODES = {
  nameRequired: 'budgets.form.errors.nameRequired',
  limitRequired: 'budgets.form.errors.limitRequired',
  limitInvalid: 'budgets.form.errors.limitInvalid',
  goalInvalid: 'budgets.form.errors.goalInvalid',
  dateFromRequired: 'budgets.form.errors.dateFromRequired',
  dateToRequired: 'budgets.form.errors.dateToRequired',
  dateRangeInvalid: 'budgets.form.errors.dateRangeInvalid',
} as const;

// ─── Hook ────────────────────────────────────────────────────────

export const useBudgetForm = ({ editBudget, onClose, initialBudgetType, workspaceId }: UseBudgetFormProps): UseBudgetFormReturn => {
  const createBudget = useBudgetsStore((s) => s.createBudget);
  const updateBudget = useBudgetsStore((s) => s.updateBudget);

  const isEditing = editBudget !== undefined;

  const buildInitialValues = (): BudgetFormValues =>
    editBudget
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

  const [values, setValues] = useState<BudgetFormValues>(buildInitialValues);
  const [errors, setErrors] = useState<BudgetFormErrors>({});

  // Reset form state when editBudget context changes (handles modal reuse)
  useEffect(() => {
    setValues(buildInitialValues());
    setErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when editBudget identity changes
  }, [editBudget?.id]);

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
      newErrors.name = ERROR_CODES.nameRequired;
    }

    if (isSavings) {
      const amount = Number(values.limitAmount);
      if (values.limitAmount && (!Number.isFinite(amount) || amount < 0)) {
        newErrors.limitAmount = ERROR_CODES.goalInvalid;
      }
    } else {
      const amount = Number(values.limitAmount);
      if (!values.limitAmount || !Number.isFinite(amount) || amount <= 0) {
        newErrors.limitAmount = ERROR_CODES.limitRequired;
      }

      if (values.periodType === 'custom') {
        if (!values.dateFrom) {
          newErrors.dateFrom = ERROR_CODES.dateFromRequired;
        }
        if (!values.dateTo) {
          newErrors.dateTo = ERROR_CODES.dateToRequired;
        }
        if (values.dateFrom && values.dateTo && values.dateFrom >= values.dateTo) {
          newErrors.dateTo = ERROR_CODES.dateRangeInvalid;
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
        workspaceId,
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
