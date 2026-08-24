import { FileSpreadsheet, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '#shared/ui/Button';

// ─── Props ───────────────────────────────────────────────────────

interface TransactionsEmptyStateProps {
  readonly onAddTransaction: () => void;
}

// ─── Component ───────────────────────────────────────────────────

export const TransactionsEmptyState = ({ onAddTransaction }: TransactionsEmptyStateProps): React.JSX.Element => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <FileSpreadsheet size={48} className="text-muted-foreground" />
      <p className="text-sm text-muted-foreground">
        {t('transactions.emptyDescription')}
      </p>
      <Button
        variant="primary"
        icon={<Plus size={14} />}
        onClick={onAddTransaction}
      >
        {t('transactions.addButton')}
      </Button>
    </div>
  );
};
