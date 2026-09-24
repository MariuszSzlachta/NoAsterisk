import { TitleCellRenderer } from '#features/csv-import/ui/TitleCellRenderer';

import { AmountCellRenderer } from '#features/csv-import/ui/AnonymizationStep/AmountCellRenderer';

export const CELL_RENDERERS = {
  title: TitleCellRenderer,
  amount: AmountCellRenderer,
};
