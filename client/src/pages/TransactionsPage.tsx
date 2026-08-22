import { FileSpreadsheet, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '#shared/ui/Button';
import { Card } from '#shared/ui/Card';
import {
  TransactionFormModal,
  TransactionGrid,
  TransactionStatusBar,
  TransactionToolbar,
  useAddTransactionModal,
  useTransactionsEmpty,
  useTransactionsPageWiring,
} from '#features/transactions';

// ─── Component ───────────────────────────────────────────────────

export const TransactionsPage = (): React.JSX.Element => {
  const { t } = useTranslation();
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
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <FileSpreadsheet size={48} className="text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {t('transactions.emptyDescription')}
          </p>
          <Button
            variant="primary"
            icon={<Plus size={14} />}
            onClick={handleOpenModal}
          >
            {t('transactions.addButton')}
          </Button>
        </div>
      ) : (
        <div className="flex max-w-[1280px] flex-col gap-4">
          <TransactionToolbar
            selectionCount={selectionCount}
            onBulkCategoryChange={handleBulkCategoryChange}
            categories={categories}
            onAddTransaction={handleOpenModal}
          />
          <Card className="overflow-hidden p-0">
            <TransactionGrid onSelectionChange={handleSelectionChange} />
            <TransactionStatusBar />
          </Card>
        </div>
      )}
      <TransactionFormModal isOpen={isModalOpen} onClose={handleCloseModal} />
    </>
  );
};
