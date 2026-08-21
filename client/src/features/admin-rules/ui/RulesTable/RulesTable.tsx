// ═══════════════════════════════════════════════════════════════════
// Admin Rules — RulesTable Component
// ═══════════════════════════════════════════════════════════════════

import type { RuleViewModel } from '#features/admin-rules/model/types';
import { buildRulesColumns } from '#features/admin-rules/ui/constants/rules-columns';
import { useRulesTable } from '#features/admin-rules/ui/hooks/useRulesTable';
import { DataTable } from '#shared/ui/DataTable';

// ─── Props ───────────────────────────────────────────────────────

interface RulesTableProps {
  readonly onEdit: (ruleId: string) => void;
}

// ─── Component ───────────────────────────────────────────────────

export const RulesTable = ({ onEdit }: RulesTableProps): React.JSX.Element => {
  const { rules, handleDelete } = useRulesTable();

  if (rules.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Brak reguł. Dodaj pierwszą regułę.
      </p>
    );
  }

  const columns = buildRulesColumns(handleDelete, onEdit);

  return (
    <DataTable<RuleViewModel>
      columns={columns}
      data={rules}
      rowKey={(row) => row.id}
    />
  );
};
