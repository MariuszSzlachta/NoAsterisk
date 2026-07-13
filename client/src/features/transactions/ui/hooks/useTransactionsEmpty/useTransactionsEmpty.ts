import { useTransactionsStore } from '#features/transactions/store/useTransactionsStore';

interface UseTransactionsEmptyResult {
  readonly isEmpty: boolean;
}

export const useTransactionsEmpty = (): UseTransactionsEmptyResult => {
  const count = useTransactionsStore((s) => s.transactions.length);
  return { isEmpty: count === 0 };
};
