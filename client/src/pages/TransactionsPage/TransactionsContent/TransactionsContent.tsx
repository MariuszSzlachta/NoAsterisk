import type { CategoryInfo } from '#model/category';
import { Card } from '#shared/ui/Card';
import {
  TransactionGrid,
  TransactionStatusBar,
  TransactionToolbar,
} from '#features/transactions';

// ─── Props ───────────────────────────────────────────────────────

interface TransactionsContentProps {
  readonly selectionCount: number;
  readonly categories: ReadonlyArray<CategoryInfo>;
  readonly onSelectionChange: (ids: string[]) => void;
  readonly onBulkCategoryChange: (categoryId: string) => void;
  readonly onAddTransaction: () => void;
}

// ─── Component ───────────────────────────────────────────────────

export const TransactionsContent = ({
  selectionCount,
  categories,
  onSelectionChange,
  onBulkCategoryChange,
  onAddTransaction,
}: TransactionsContentProps): React.JSX.Element => {
  return (
    <div className="mx-auto flex min-h-0 min-w-0 w-full max-w-[1280px] flex-1 flex-col gap-3 lg:flex-none lg:gap-4">
      <TransactionToolbar
        selectionCount={selectionCount}
        onBulkCategoryChange={onBulkCategoryChange}
        categories={categories}
        onAddTransaction={onAddTransaction}
      />
      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden !p-0 lg:!h-auto lg:flex-none">
        <TransactionGrid onSelectionChange={onSelectionChange} />
        <TransactionStatusBar />
      </Card>
    </div>
  );
};
