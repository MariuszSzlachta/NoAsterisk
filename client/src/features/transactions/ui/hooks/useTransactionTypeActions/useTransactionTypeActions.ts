import type { useTransactionForm } from '#features/transactions/ui/hooks/useTransactionForm';
import { useActionFactory } from '#shared/hooks/useActionFactory';

interface TypeActionResult {
  readonly createTypeChangeHandler: (value: 'income' | 'expense') => () => void;
}
export const useTransactionTypeActions = (
  handleChange: ReturnType<typeof useTransactionForm>['handleChange'],
): TypeActionResult => {
  const handleTypeChange = (value: 'income' | 'expense'): void => {
    handleChange('type', value);
  };
  const { createActionHandler: createTypeChangeHandler } =
    useActionFactory(handleTypeChange);
  return { createTypeChangeHandler };
};
