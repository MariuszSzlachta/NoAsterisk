import type { TFunction } from 'i18next';

import type { RuleViewModel } from '#features/admin-rules/model/types';
import { RuleActionButtons } from '#features/admin-rules/ui/constants/rules-columns/RuleActionButtons';
import type { DataTableColumn } from '#shared/ui/DataTable';

export const buildRulesColumns = (
  handleDelete: (id: string) => void,
  handleEdit: (id: string) => void,
  t: TFunction,
): readonly DataTableColumn<RuleViewModel>[] => [
  {
    key: 'keyword',
    header: t('rules.columns.keyword'),
    render: (row) => (
      <span className="font-medium text-foreground">{row.keyword}</span>
    ),
  },
  {
    key: 'matcherLabel',
    header: t('rules.columns.matcher'),
    render: (row) => (
      <span className="text-muted-foreground">{row.matcherLabel}</span>
    ),
  },
  {
    key: 'categoryLabel',
    header: t('rules.columns.category'),
    render: (row) => (
      <span className="flex items-center gap-2">
        <span
          className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: row.categoryColor }}
        />
        <span className="text-foreground">{row.categoryLabel}</span>
      </span>
    ),
  },
  {
    key: 'priority',
    header: t('rules.columns.priority'),
    render: (row) => (
      <span className="font-mono text-sm tabular-nums text-muted-foreground">
        {row.priority}
      </span>
    ),
    className: 'w-24 text-center',
  },
  {
    key: 'actions',
    header: t('rules.columns.actions'),
    render: (row) => (
      <RuleActionButtons
        row={row}
        handleDelete={handleDelete}
        handleEdit={handleEdit}
        t={t}
      />
    ),
    className: 'w-24',
  },
];
