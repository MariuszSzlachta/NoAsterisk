// ═══════════════════════════════════════════════════════════════════
// Admin Rules — RulesTable Component
// ═══════════════════════════════════════════════════════════════════

import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const { rules, handleDelete } = useRulesTable();

  if (rules.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {t('rules.emptyState')}
      </p>
    );
  }

  // REVIEW [P0]: Ten kod obecnie nie przechodzi tsc: DataTable wymaga
  // TRow extends Record<string, unknown>, ale RuleViewModel jest poprawnym
  // interfejsem bez index signature. Napraw kontrakt wspólnego DataTable (bez
  // zaśmiecania modeli domenowych index signature), a dopiero potem oceniaj
  // memoizację.
  // useMemo not needed: DataTable is not memoized, re-renders are driven by
  // data changes (rules CRUD) which are infrequent. No measured performance issue.
  const columns = buildRulesColumns(handleDelete, onEdit, t);

  return (
    <DataTable<RuleViewModel>
      columns={columns}
      data={rules}
      rowKey={(row) => row.id}
    />
  );
};
