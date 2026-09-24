import type { BudgetType } from '#features/budgets/model/types/budget-type';
import type { useBudgetForm } from '#features/budgets/ui/hooks/useBudgetForm';

interface FormInteractions {
  readonly handleFormSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  readonly createBudgetTypeHandler: (type: BudgetType) => () => void;
  readonly createColorHandler: (color: string) => () => void;
  readonly createPeriodHandler: (
    period: 'monthly' | 'yearly' | 'custom',
  ) => () => void;
  readonly handleNameChange: (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => void;
  readonly handleLimitAmountChange: (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => void;
  readonly handleDateFromChange: (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => void;
  readonly handleDateToChange: (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => void;
}
export const useBudgetFormInteractions = ({
  handleChange,
  handleBudgetTypeChange,
  handleSubmit,
}: ReturnType<typeof useBudgetForm>): FormInteractions => {
  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    handleSubmit();
  };
  const createBudgetTypeHandler =
    (type: BudgetType): (() => void) =>
    (): void =>
      handleBudgetTypeChange(type);
  const createColorHandler =
    (color: string): (() => void) =>
    (): void =>
      handleChange('color', color);
  const createPeriodHandler =
    (period: 'monthly' | 'yearly' | 'custom'): (() => void) =>
    (): void =>
      handleChange('periodType', period);
  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>): void =>
    handleChange('name', event.target.value);
  const handleLimitAmountChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ): void => handleChange('limitAmount', event.target.value);
  const handleDateFromChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ): void => handleChange('dateFrom', event.target.value);
  const handleDateToChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ): void => handleChange('dateTo', event.target.value);
  return {
    handleFormSubmit,
    createBudgetTypeHandler,
    createColorHandler,
    createPeriodHandler,
    handleNameChange,
    handleLimitAmountChange,
    handleDateFromChange,
    handleDateToChange,
  };
};
