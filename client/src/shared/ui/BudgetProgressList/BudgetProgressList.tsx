interface BudgetProgressItem {
  label: string;
  spent: number;
  limit: number;
  color: string;
}

interface BudgetProgressListProps {
  items: BudgetProgressItem[];
  currency?: string;
}

const formatAmount = (value: number, currency: string): string => {
  const formatted = value.toLocaleString('pl-PL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${formatted} ${currency}`;
};

export const BudgetProgressList = ({
  items,
  currency = 'zł',
}: BudgetProgressListProps): React.JSX.Element => {
  return (
    <div className="flex flex-col gap-4">
      {items.map((item) => {
        const percentage = Math.min(100, (item.spent / item.limit) * 100);
        const isOverBudget = item.spent > item.limit;

        return (
          <div key={item.label}>
            <div className="mb-1.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-sm"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm font-medium text-foreground">
                  {item.label}
                </span>
              </div>
              <span className="font-mono text-sm tabular-nums">
                <span className="text-muted-foreground">{formatAmount(item.spent, currency)}</span>
                <span className="text-subtle"> / {formatAmount(item.limit, currency)}</span>
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-3">
              <div
                className={`h-full rounded-full transition-all duration-300 ${isOverBudget ? 'bg-expense' : ''}`}
                style={{
                  width: `${percentage}%`,
                  ...(isOverBudget ? {} : { backgroundColor: item.color }),
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
