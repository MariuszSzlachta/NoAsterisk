import {
  TransactionFormModal,
  useAddTransactionModal,
  useTransactionsEmpty,
  useTransactionsPageWiring,
} from '#features/transactions';

import { TransactionsContent } from '#pages/TransactionsPage/TransactionsContent';
import { TransactionsEmptyState } from '#pages/TransactionsPage/TransactionsEmptyState';

// ─── Page ────────────────────────────────────────────────────────

export const TransactionsPage = (): React.JSX.Element => {
  const { isEmpty } = useTransactionsEmpty();
  const {
    selectionCount,
    categories,
    handleSelectionChange,
    handleBulkCategoryChange,
  } = useTransactionsPageWiring();
  const { isModalOpen, handleOpenModal, handleCloseModal } = useAddTransactionModal();

  return (
    <>
      {isEmpty ? (
        <TransactionsEmptyState onAddTransaction={handleOpenModal} />
      ) : (
        <TransactionsContent
          selectionCount={selectionCount}
          categories={categories}
          onSelectionChange={handleSelectionChange}
          onBulkCategoryChange={handleBulkCategoryChange}
          onAddTransaction={handleOpenModal}
        />
      )}
      <TransactionFormModal isOpen={isModalOpen} onClose={handleCloseModal} />
    </>
  );
};
