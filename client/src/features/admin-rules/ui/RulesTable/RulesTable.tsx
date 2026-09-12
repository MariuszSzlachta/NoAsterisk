import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, Trash2 } from 'lucide-react';

import type { RuleViewModel } from '#features/admin-rules/model/types';
import { buildRulesColumns } from '#features/admin-rules/ui/constants/rules-columns';
import { useRulesTable } from '#features/admin-rules/ui/hooks/useRulesTable';
import { Button } from '#shared/ui/Button';
import { Card } from '#shared/ui/Card';
import { ConfirmDeleteModal } from '#shared/ui/ConfirmDeleteModal';
import { DataTable } from '#shared/ui/DataTable';

interface RulesTableProps {
  readonly onEdit: (ruleId: string) => void;
}

interface RuleActionsProps {
  readonly rule: RuleViewModel;
  readonly onEdit: (ruleId: string) => void;
  readonly onDelete: (ruleId: string) => void;
  readonly editLabel: string;
  readonly deleteLabel: string;
}

const RuleActions = ({
  rule,
  onEdit,
  onDelete,
  editLabel,
  deleteLabel,
}: RuleActionsProps): React.JSX.Element => (
  <div className="flex shrink-0 items-center gap-1">
    <Button
      variant="ghost"
      size="icon"
      icon={<Pencil size={14} />}
      onClick={() => onEdit(rule.id)}
      aria-label={editLabel}
    />
    <Button
      variant="ghost"
      size="icon"
      icon={<Trash2 size={14} />}
      onClick={() => onDelete(rule.id)}
      aria-label={deleteLabel}
    />
  </div>
);

interface RuleMobileCardProps {
  readonly rule: RuleViewModel;
  readonly onEdit: (ruleId: string) => void;
  readonly onDelete: (ruleId: string) => void;
  readonly categoryLabel: string;
  readonly priorityLabel: string;
  readonly editLabel: string;
  readonly deleteLabel: string;
}

const RuleMobileCard = ({
  rule,
  onEdit,
  onDelete,
  categoryLabel,
  priorityLabel,
  editLabel,
  deleteLabel,
}: RuleMobileCardProps): React.JSX.Element => (
  <Card className="!h-auto shrink-0 gap-0 border-border bg-surface-2 p-4">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="break-words text-sm font-medium text-foreground">
          {rule.keyword}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {rule.matcherLabel}
        </p>
      </div>
      <RuleActions
        rule={rule}
        onEdit={onEdit}
        onDelete={onDelete}
        editLabel={editLabel}
        deleteLabel={deleteLabel}
      />
    </div>
    <div className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-3 text-xs">
      <div className="min-w-0">
        <p className="text-muted-foreground">{categoryLabel}</p>
        <div className="mt-1 flex min-w-0 items-center gap-2">
          <span
            className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: rule.categoryColor }}
          />
          <span className="truncate text-sm text-foreground">
            {rule.categoryLabel}
          </span>
        </div>
      </div>
      <div className="text-right">
        <p className="text-muted-foreground">{priorityLabel}</p>
        <p className="mt-1 font-mono text-sm tabular-nums text-foreground">
          {rule.priority}
        </p>
      </div>
    </div>
  </Card>
);

export const RulesTable = ({ onEdit }: RulesTableProps): React.JSX.Element => {
  const { t } = useTranslation();
  const { rules, handleDelete } = useRulesTable();
  const [pendingDelete, setPendingDelete] = useState<
    RuleViewModel | undefined
  >();

  if (rules.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {t('rules.emptyState')}
      </p>
    );
  }

  const requestDelete = (id: string): void => {
    setPendingDelete(rules.find((rule) => rule.id === id));
  };
  const confirmDelete = (): void => {
    if (pendingDelete === undefined) {
      return;
    }
    handleDelete(pendingDelete.id);
    setPendingDelete(undefined);
  };
  const columns = buildRulesColumns(requestDelete, onEdit, t);

  return (
    <>
      <div className="hidden lg:block">
        <DataTable<RuleViewModel>
          columns={columns}
          data={rules}
          rowKey={(row) => row.id}
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
          onCancel={() => setPendingDelete(undefined)}
        />
      )}
    </>
  );
};
