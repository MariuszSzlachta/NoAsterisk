import { FileSpreadsheet } from 'lucide-react';

import { Card } from '#shared/ui/Card';
import {
  TransactionGrid,
  TransactionStatusBar,
  TransactionToolbar,
  useTransactionsEmpty,
} from '#features/transactions';

// ─── Component ───────────────────────────────────────────────────

export const TransactionsPage = (): React.JSX.Element => {
  const { isEmpty } = useTransactionsEmpty();

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <FileSpreadsheet size={48} className="text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Brak transakcji. Zaimportuj CSV aby rozpocząć.
        </p>
      </div>
    );
  }

  return (
    <div className="flex max-w-[1280px] flex-col gap-4">
      <TransactionToolbar />
      <Card className="overflow-hidden p-0">
        <TransactionGrid />
        <TransactionStatusBar />
      </Card>
    </div>
  );
};
