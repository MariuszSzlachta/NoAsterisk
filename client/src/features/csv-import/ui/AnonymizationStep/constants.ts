import { TitleCellRenderer } from '../TitleCellRenderer';

export const LEGEND_ITEMS = [
  { key: 'safe', color: 'bg-income', i18nKey: 'import.anonymization.legend.safe' },
  { key: 'needs_review', color: 'bg-warning', i18nKey: 'import.anonymization.legend.needsReview' },
  { key: 'anonymized', color: 'bg-expense', i18nKey: 'import.anonymization.legend.anonymized' },
] as const;

export const CELL_RENDERERS = { title: TitleCellRenderer } as const;
