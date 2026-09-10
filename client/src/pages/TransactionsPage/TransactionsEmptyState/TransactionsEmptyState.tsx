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
    <div className="flex min-h-[calc(100dvh-7rem)] flex-col items-center justify-center gap-4 py-8 text-center lg:min-h-0 lg:py-24">
      <FileSpreadsheet size={48} className="text-muted-foreground" />
      <p className="text-sm text-muted-foreground">
        {t('transactions.emptyDescription')}
      </p>
      <Button
        variant="primary"
        icon={<Plus size={14} />}
        onClick={onAddTransaction}
        className="min-h-12 px-4 lg:min-h-0"
      >
        {t('transactions.addButton')}
      </Button>
    </div>
  );
};
