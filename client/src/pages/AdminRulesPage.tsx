import { useTranslation } from 'react-i18next';
import { ListChecks, Play, Plus } from 'lucide-react';

import {
  RuleFormModal,
  RulesTable,
  useAdminRulesPage,
} from '#features/admin-rules';
import { Button } from '#shared/ui/Button';

// ─── Component ───────────────────────────────────────────────────

export const AdminRulesPage = (): React.JSX.Element => {
  const { t } = useTranslation();
  const {
    showForm,
    editingRule,
    lastResult,
    handleAddRule,
    handleEditRule,
    handleCloseForm,
    handleApplyRules,
  } = useAdminRulesPage();

  return (
    <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold text-foreground">
          <ListChecks size={20} className="mr-2 inline-block text-primary" />
          {t('rules.pageTitle')}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('rules.pageDescription')}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button icon={<Plus size={14} />} onClick={handleAddRule}>
          {t('rules.addRule')}
        </Button>
        <Button
          variant="secondary"
          icon={<Play size={14} />}
          onClick={handleApplyRules}
        >
          {t('rules.applyRules')}
        </Button>
      </div>

      {lastResult && (
        <p className="text-sm text-muted-foreground">
          {t('rules.resultText', {
            categorized: lastResult.categorized,
            total: lastResult.total,
          })}
        </p>
      )}

      <RuleFormModal
        key={editingRule?.id ?? 'new'}
        isOpen={showForm}
        editingRule={editingRule}
        onClose={handleCloseForm}
      />

      <RulesTable onEdit={handleEditRule} />
    </div>
  );
};
