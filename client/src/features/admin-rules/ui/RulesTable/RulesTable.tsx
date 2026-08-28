import { useTranslation } from 'react-i18next';

import type { RuleViewModel } from '#features/admin-rules/model/types';
import { buildRulesColumns } from '#features/admin-rules/ui/constants/rules-columns';
import { useRulesTable } from '#features/admin-rules/ui/hooks/useRulesTable';
import { DataTable } from '#shared/ui/DataTable';

interface RulesTableProps {
  readonly onEdit: (ruleId: string) => void;
}

export const RulesTable = ({ onEdit }: RulesTableProps): React.JSX.Element => {
  const { t } = useTranslation();
  const { rules, handleDelete } = useRulesTable();

  if (rules.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {t('rules.emptyState')}
      </p>
    );
  }

  const columns = buildRulesColumns(handleDelete, onEdit, t);

  return (
    <DataTable<RuleViewModel>
      columns={columns}
      data={rules}
      rowKey={(row) => row.id}
    />
  );
};
