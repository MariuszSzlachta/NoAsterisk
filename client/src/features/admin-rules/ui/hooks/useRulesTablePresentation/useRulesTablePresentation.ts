import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { RuleViewModel } from '#features/admin-rules/model/types';
import { buildRulesColumns } from '#features/admin-rules/ui/constants/rules-columns';
import { useRulesTable } from '#features/admin-rules/ui/hooks/useRulesTable';
import type { DataTableColumn } from '#shared/ui/DataTable';

interface RulesPresentation {
  readonly rules: readonly RuleViewModel[];
  readonly pendingDelete: RuleViewModel | undefined;
  readonly columns: readonly DataTableColumn<RuleViewModel>[];
  readonly requestDelete: (id: string) => void;
  readonly confirmDelete: () => void;
  readonly cancelDelete: () => void;
  readonly getRowKey: (row: RuleViewModel) => string;
}
export const useRulesTablePresentation = (
  onEdit: (id: string) => void,
): RulesPresentation => {
  const { t } = useTranslation();
  const { rules, handleDelete } = useRulesTable();
  const [pendingDelete, setPendingDelete] = useState<RuleViewModel>();
  const requestDelete = (id: string): void => {
    setPendingDelete(rules.find((rule) => rule.id === id));
  };
  const cancelDelete = (): void => {
    setPendingDelete(undefined);
  };
  const confirmDelete = (): void => {
    if (pendingDelete === undefined) return;
    handleDelete(pendingDelete.id);
    setPendingDelete(undefined);
  };
  const getRowKey = (row: RuleViewModel): string => row.id;
  return {
    rules,
    pendingDelete,
    requestDelete,
    confirmDelete,
    cancelDelete,
    getRowKey,
    columns: buildRulesColumns(requestDelete, onEdit, t),
  };
};
