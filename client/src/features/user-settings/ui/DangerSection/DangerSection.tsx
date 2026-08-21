// ═══════════════════════════════════════════════════════════════════
// User Settings — DangerSection Component
// ═══════════════════════════════════════════════════════════════════

import { Trash2 } from 'lucide-react';

import { ConfirmDialog } from '#features/user-settings/ui/ConfirmDialog';
import { useDangerSection } from '#features/user-settings/ui/hooks/useDangerSection';
import { Button } from '#shared/ui/Button';
import { Card } from '#shared/ui/Card';

// ─── Component ───────────────────────────────────────────────────

export const DangerSection = (): React.JSX.Element => {
  const {
    showClearDialog,
    showDeleteDialog,
    isDeleting,
    deleteError,
    deletePassword,
    handleOpenClearDialog,
    handleCloseClearDialog,
    handleConfirmClear,
    handleOpenDeleteDialog,
    handleCloseDeleteDialog,
    handleDeletePasswordChange,
    handleConfirmDelete,
  } = useDangerSection();

  return (
    <>
      <Card className="mb-6 border-expense/30">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-expense">Strefa niebezpieczna</h2>
          <p className="text-xs text-muted-foreground">Te akcje są nieodwracalne. Zachowaj ostrożność.</p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-expense/20 bg-expense-soft/30 p-3">
            <div className="mr-4">
              <div className="text-sm font-medium text-foreground">Wyczyść dane lokalne</div>
              <div className="text-xs text-muted-foreground">
                Usuwa wszystkie transakcje, reguły i preferencje z przeglądarki.
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleOpenClearDialog}
              icon={<Trash2 size={14} />}
              className="shrink-0 text-expense hover:text-expense"
            >
              Wyczyść dane
            </Button>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-expense/20 bg-expense-soft/30 p-3">
            <div className="mr-4">
              <div className="text-sm font-medium text-foreground">Usuń konto</div>
              <div className="text-xs text-muted-foreground">
                Trwale usuwa Twoje konto i wszystkie dane z serwera.
              </div>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleOpenDeleteDialog}
              icon={<Trash2 size={14} />}
              className="shrink-0"
            >
              Usuń konto
            </Button>
          </div>
        </div>

        {deleteError && (
          <p className="mt-3 text-xs text-expense" role="alert">{deleteError}</p>
        )}
      </Card>

      {showClearDialog && (
        <ConfirmDialog
          title="Wyczyść dane lokalne"
          description="Ta akcja jest nieodwracalna. Wszystkie dane lokalne (transakcje, reguły, preferencje) zostaną usunięte."
          confirmText="USUŃ"
          confirmButtonLabel="Wyczyść dane"
          onConfirm={handleConfirmClear}
          onCancel={handleCloseClearDialog}
        />
      )}

      {showDeleteDialog && (
        <ConfirmDialog
          title="Usuń konto"
          description="Twoje konto zostanie trwale usunięte wraz ze wszystkimi danymi na serwerze. Tej akcji nie można cofnąć."
          confirmText="USUŃ KONTO"
          confirmButtonLabel={isDeleting ? 'Usuwam...' : 'Usuń konto'}
          onConfirm={handleConfirmDelete}
          onCancel={handleCloseDeleteDialog}
          extraFields={[
            {
              label: 'Hasło',
              type: 'password',
              placeholder: 'Wpisz hasło aby potwierdzić',
              value: deletePassword,
              onChange: handleDeletePasswordChange,
            },
          ]}
        />
      )}
    </>
  );
};
