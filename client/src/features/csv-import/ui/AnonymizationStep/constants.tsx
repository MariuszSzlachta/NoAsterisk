import type { CellRendererParams } from '#shared/adapters/grid';

import { TitleCellRenderer } from '../TitleCellRenderer';
import type { AnonymizationGridRow } from '../hooks/useAnonymizationGrid';

const AmountCellRenderer = ({ value }: CellRendererParams<AnonymizationGridRow>): React.JSX.Element => {
  const amount = value as number;
  if (typeof amount !== 'number' || Number.isNaN(amount) || !Number.isFinite(amount)) {
    return <span className="text-xs text-expense">—</span>;
  }
  const isNegative = amount < 0;
  const formatted = new Intl.NumberFormat('pl-PL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));
  return (
    <span className={`font-mono text-sm tabular-nums ${isNegative ? 'text-expense' : 'text-income'}`}>
      {isNegative ? `−${formatted}` : `+${formatted}`}
    </span>
  );
};

export const LEGEND_ITEMS = [
  { key: 'safe', color: 'bg-income', i18nKey: 'import.anonymization.legend.safe' },
  { key: 'needs_review', color: 'bg-warning', i18nKey: 'import.anonymization.legend.needsReview' },
  { key: 'anonymized', color: 'bg-expense', i18nKey: 'import.anonymization.legend.anonymized' },
] as const;

export const CELL_RENDERERS = {
  title: TitleCellRenderer,
  amount: AmountCellRenderer,
} as const;
