import type { CategoryInfo } from '#entities/category';
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
    <div className="flex max-w-[1280px] flex-col gap-4">
      <TransactionToolbar
        selectionCount={selectionCount}
        onBulkCategoryChange={onBulkCategoryChange}
        categories={categories}
        onAddTransaction={onAddTransaction}
      />
      <Card className="overflow-hidden p-0">
        <TransactionGrid onSelectionChange={onSelectionChange} />
        <TransactionStatusBar />
      </Card>
    </div>
  );
};
