import { useTranslation } from 'react-i18next';

import type { RowAction } from '#shared/adapters/grid';

import type { AnonymizationGridRow } from '#features/csv-import/ui/hooks/useAnonymizationGrid/types';


interface UseAnonymizationRowActionsParams {
  readonly onEdit: (rowIndex: number) => void;
  readonly onRestore: (rowIndex: number) => void;
}


export const useAnonymizationRowActions = ({
  onEdit,
  onRestore,
}: UseAnonymizationRowActionsParams): ((
  row: AnonymizationGridRow,
) => RowAction<AnonymizationGridRow>[]) => {
  const { t } = useTranslation();

  const getRowActions = (
    row: AnonymizationGridRow,
  ): RowAction<AnonymizationGridRow>[] => {
    const editAction: RowAction<AnonymizationGridRow> = {
      label: t('import.anonymization.popover.edit'),
      onClick: (r) => onEdit(r.rowIndex),
    };

    if (row.anonymizationStatus === 'safe') {
      return [editAction];
    }

    const restoreAction: RowAction<AnonymizationGridRow> = {
      label: t('import.anonymization.popover.restore'),
      onClick: (r) => onRestore(r.rowIndex),
    };

    return [restoreAction, editAction];
  };

  return getRowActions;
};
