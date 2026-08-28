import type { CellRendererParams } from '#shared/adapters/grid';

import type { AnonymizationGridRow } from '#features/csv-import/ui/hooks/useAnonymizationGrid/types';

export const AmountCellRenderer = ({
  value,
}: CellRendererParams<AnonymizationGridRow>): React.JSX.Element => {
  const amount = value as number;
  if (
    typeof amount !== 'number' ||
    Number.isNaN(amount) ||
    !Number.isFinite(amount)
  ) {
    return <span className="text-xs text-expense">—</span>;
  }
  const isNegative = amount < 0;
  const formatted = new Intl.NumberFormat('pl-PL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));
  return (
    <span
      className={`font-mono text-sm tabular-nums ${isNegative ? 'text-expense' : 'text-income'}`}
    >
      {isNegative ? `−${formatted}` : `+${formatted}`}
    </span>
  );
};
