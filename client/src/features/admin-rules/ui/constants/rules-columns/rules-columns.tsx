// ═══════════════════════════════════════════════════════════════════
// Admin Rules — Rules Table Column Definitions
// ═══════════════════════════════════════════════════════════════════

import { Pencil, Trash2 } from 'lucide-react';

import type { RuleViewModel } from '#features/admin-rules/model/types';
import { Button } from '#shared/ui/Button';
import type { DataTableColumn } from '#shared/ui/DataTable';

// ─── Column Builder ──────────────────────────────────────────────

export const buildRulesColumns = (
  handleDelete: (id: string) => void,
  handleEdit: (id: string) => void,
): readonly DataTableColumn<RuleViewModel>[] => [
  {
    key: 'keyword',
    header: 'Słowo kluczowe',
    render: (row) => (
      <span className="font-medium text-foreground">{row.keyword}</span>
    ),
  },
  {
    key: 'matcherLabel',
    header: 'Dopasowanie',
    render: (row) => (
      <span className="text-muted-foreground">{row.matcherLabel}</span>
    ),
  },
  {
    key: 'categoryLabel',
    header: 'Kategoria',
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
    header: 'Priorytet',
    render: (row) => (
      <span className="font-mono text-sm tabular-nums text-muted-foreground">
        {row.priority}
      </span>
    ),
    className: 'w-24 text-center',
  },
  {
    key: 'actions',
    header: 'Akcje',
    render: (row) => (
      <span className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          icon={<Pencil size={14} />}
          onClick={() => handleEdit(row.id)}
          aria-label={`Edytuj regułę ${row.keyword}`}
        />
        <Button
          variant="ghost"
          size="icon"
          icon={<Trash2 size={14} />}
          onClick={() => handleDelete(row.id)}
          aria-label={`Usuń regułę ${row.keyword}`}
        />
      </span>
    ),
    className: 'w-24',
  },
];
