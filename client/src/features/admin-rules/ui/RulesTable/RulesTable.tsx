import { useTranslation } from 'react-i18next';

import type { RuleViewModel } from '#features/admin-rules/model/types';
import { useRulesTablePresentation } from '#features/admin-rules/ui/hooks/useRulesTablePresentation';
import { RuleMobileCard } from '#features/admin-rules/ui/RulesTable/RuleMobileCard';
import { ConfirmDeleteModal } from '#shared/ui/ConfirmDeleteModal';
import { DataTable } from '#shared/ui/DataTable';

interface RulesTableProps {
  readonly onEdit: (ruleId: string) => void;
}

export const RulesTable = ({ onEdit }: RulesTableProps): React.JSX.Element => {
  const { t } = useTranslation();
  const {
    rules,
    pendingDelete,
    columns,
    requestDelete,
    confirmDelete,
    cancelDelete,
    getRowKey,
  } = useRulesTablePresentation(onEdit);
  if (rules.length === 0)
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {t('rules.emptyState')}
      </p>
    );

  return (
    <>
      <div className="hidden lg:block">
        <DataTable<RuleViewModel>
          columns={columns}
          data={rules}
          rowKey={getRowKey}
        />
      </div>
      <div className="flex flex-col gap-2 lg:hidden">
        {rules.map((rule) => (
          <RuleMobileCard
            key={rule.id}
            rule={rule}
            onEdit={onEdit}
            onDelete={requestDelete}
            categoryLabel={t('rules.columns.category')}
            priorityLabel={t('rules.columns.priority')}
            editLabel={t('rules.actions.edit', { keyword: rule.keyword })}
            deleteLabel={t('rules.actions.delete', { keyword: rule.keyword })}
          />
        ))}
      </div>
      {pendingDelete && (
        <ConfirmDeleteModal
          title={t('rules.deleteConfirmTitle')}
          description={t('rules.deleteConfirmDescription', {
            keyword: pendingDelete.keyword,
          })}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}
    </>
  );
};
