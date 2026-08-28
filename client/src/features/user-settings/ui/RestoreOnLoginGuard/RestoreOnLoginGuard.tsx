// User Settings — RestoreOnLoginGuard
//
// Rendered inside AppShell. On mount, checks if local stores are
// empty and a server backup exists. If so, prompts the user to
// restore from their encrypted vault backup.

import { RestoreDialog } from '#features/user-settings/ui/RestoreDialog';
import { useRestoreOnLogin } from '#features/user-settings/ui/hooks/useRestoreOnLogin';


export const RestoreOnLoginGuard = (): React.JSX.Element | null => {
  const {
    showDialog,
    backupDate,
    isRestoring,
    error,
    handleRestore,
    handleDismiss,
  } = useRestoreOnLogin();

  if (!showDialog) {
    return null;
  }

  return (
    <RestoreDialog
      backupDate={backupDate}
      isLoading={isRestoring}
      error={error}
      onRestore={handleRestore}
      onCancel={handleDismiss}
    />
  );
};
