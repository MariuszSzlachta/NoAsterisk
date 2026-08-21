// ═══════════════════════════════════════════════════════════════════
// User Settings — DangerSection Component
// ═══════════════════════════════════════════════════════════════════

import { Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { ConfirmDialog } from '#features/user-settings/ui/ConfirmDialog';
import { useDangerSection } from '#features/user-settings/ui/hooks/useDangerSection';
import { Button } from '#shared/ui/Button';
import { Card } from '#shared/ui/Card';

// ─── Component ───────────────────────────────────────────────────

export const DangerSection = (): React.JSX.Element => {
  const { t } = useTranslation();
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
      <Card className="border-expense/30">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-expense">{t('settings.danger.title')}</h2>
          <p className="text-xs text-muted-foreground">{t('settings.danger.subtitle')}</p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-expense/20 bg-expense-soft/30 p-3">
            <div className="mr-4">
              <div className="text-sm font-medium text-foreground">{t('settings.danger.clearData')}</div>
              <div className="text-xs text-muted-foreground">{t('settings.danger.clearDataDescription')}</div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleOpenClearDialog}
              icon={<Trash2 size={14} />}
              className="shrink-0 text-expense hover:text-expense"
            >
              {t('settings.danger.clearDataButton')}
            </Button>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-expense/20 bg-expense-soft/30 p-3">
            <div className="mr-4">
              <div className="text-sm font-medium text-foreground">{t('settings.danger.deleteAccount')}</div>
              <div className="text-xs text-muted-foreground">{t('settings.danger.deleteAccountDescription')}</div>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleOpenDeleteDialog}
              icon={<Trash2 size={14} />}
              className="shrink-0"
            >
              {t('settings.danger.deleteAccountButton')}
            </Button>
          </div>
        </div>

        {deleteError && (
          <p className="mt-3 text-xs text-expense" role="alert">{deleteError}</p>
        )}
      </Card>

      {showClearDialog && (
        <ConfirmDialog
          title={t('settings.danger.clearDialog.title')}
          description={t('settings.danger.clearDialog.description')}
          confirmText={t('settings.danger.clearDialog.confirmText')}
          confirmButtonLabel={t('settings.danger.clearDialog.confirmButton')}
          onConfirm={handleConfirmClear}
          onCancel={handleCloseClearDialog}
        />
      )}

      {showDeleteDialog && (
        <ConfirmDialog
          title={t('settings.danger.deleteDialog.title')}
          description={t('settings.danger.deleteDialog.description')}
          confirmText={t('settings.danger.deleteDialog.confirmText')}
          confirmButtonLabel={isDeleting ? t('settings.danger.deleteDialog.deleting') : t('settings.danger.deleteDialog.confirmButton')}
          onConfirm={handleConfirmDelete}
          onCancel={handleCloseDeleteDialog}
          extraFields={[
            {
              label: t('settings.danger.deleteDialog.passwordLabel'),
              type: 'password',
              placeholder: t('settings.danger.deleteDialog.passwordPlaceholder'),
              value: deletePassword,
              onChange: handleDeletePasswordChange,
            },
          ]}
        />
      )}
    </>
  );
};
