import { useTranslation } from 'react-i18next';
import { Search, X } from 'lucide-react';

import { useAssignTransaction } from '#features/budgets/ui/hooks/useAssignTransaction';
import { useActionFactory } from '#shared/hooks/useActionFactory';
import { formatAmount } from '#shared/lib';
import { Button } from '#shared/ui/Button';
import { Checkbox } from '#shared/ui/Checkbox';
import { Input } from '#shared/ui/Input';

// ─── Props ───────────────────────────────────────────────────────

interface AssignTransactionModalProps {
  readonly isOpen: boolean;
  readonly budgetId: string;
  readonly onClose: () => void;
}

// ─── Component ───────────────────────────────────────────────────

export const AssignTransactionModal = ({
  isOpen,
  budgetId,
  onClose,
}: AssignTransactionModalProps): React.JSX.Element | null => {
  const { t } = useTranslation();
  const {
    unassignedTransactions,
    selectedIds,
    searchQuery,
    hasSelection,
    handleToggleSelection,
    handleSelectAll,
    handleDeselectAll,
    handleSearchChange,
    handleAssign,
    filteredCount,
  } = useAssignTransaction({ budgetId, onClose });

  const { createActionHandler: createSelectionHandler } = useActionFactory(
    handleToggleSelection,
  );

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="assign-tx-title"
    >
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
        aria-label={t('budgets.assign.closeModal')}
        tabIndex={-1}
      />

      {/* Modal */}
      <div className="relative flex w-full max-w-lg max-h-[80vh] flex-col rounded-lg border border-border bg-surface shadow-card">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-5">
          <h2
            id="assign-tx-title"
            className="text-lg font-semibold text-foreground"
          >
            {t('budgets.assign.title')}
          </h2>
          <button
            type="button"
            className="rounded-sm p-1 text-muted-foreground transition-colors hover:text-foreground"
            onClick={onClose}
            aria-label={t('budgets.assign.close')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="border-b border-border px-5 py-3">
          <Input
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder={t('budgets.assign.searchPlaceholder')}
            icon={<Search size={14} />}
          />
        </div>

        {/* Selection toolbar */}
        <div className="flex items-center justify-between border-b border-border px-5 py-2">
          <span className="text-xs text-muted-foreground">
            {t('budgets.assign.countUnassigned', { count: filteredCount })}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              className="text-xs text-primary transition-colors hover:text-primary/80"
              onClick={handleSelectAll}
            >
              {t('budgets.assign.selectAll')}
            </button>
            {hasSelection && (
              <button
                type="button"
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                onClick={handleDeselectAll}
              >
                {t('budgets.assign.deselectAll')}
              </button>
            )}
          </div>
        </div>

        {/* Transaction list */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {unassignedTransactions.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <span className="text-sm text-muted-foreground">
                {t('budgets.assign.empty')}
              </span>
            </div>
          ) : (
            <ul className="flex flex-col gap-1">
              {unassignedTransactions.map((tx) => (
                <li
                  key={tx.id}
                  className="flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-surface-2"
                >
                  <Checkbox
                    checked={selectedIds.has(tx.id)}
                    onChange={createSelectionHandler(tx.id)}
                    aria-label={t('budgets.assign.selectTransaction', {
                      description: tx.description,
                    })}
                  />
                  <div className="flex flex-1 items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-foreground">
                        {tx.description}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {tx.date}
                      </span>
                    </div>
                    <span
                      className={`font-mono text-xs tabular-nums ${tx.amount >= 0 ? 'text-income' : 'text-expense'}`}
                    >
                      {formatAmount(tx.amount)} {tx.currency}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-5 py-4">
          <span className="text-xs text-muted-foreground">
            {t('budgets.assign.selectedCount', { count: selectedIds.size })}
          </span>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={onClose}>
              {t('budgets.assign.cancel')}
            </Button>
            <Button
              variant="primary"
              onClick={handleAssign}
              disabled={!hasSelection}
            >
              {t('budgets.assign.submit', { count: selectedIds.size })}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
