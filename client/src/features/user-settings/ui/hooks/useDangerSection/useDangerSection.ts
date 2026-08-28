// User Settings — useDangerSection Hook

import { useState } from 'react';

import { useDeleteAccountMutation } from '#features/user-settings/api/useDeleteAccountMutation';
import { useLogoutMutation } from '#features/user-settings/api/useLogoutMutation';
import type { UseDangerSectionResult } from '#features/user-settings/ui/hooks/useDangerSection/use-danger-section-result';

export const useDangerSection = (): UseDangerSectionResult => {
  const { state: deleteState, mutateAsync: deleteAccount } = useDeleteAccountMutation();
  const { mutateAsync: logout } = useLogoutMutation();

  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');

  const handleOpenClearDialog = (): void => { setShowClearDialog(true); };
  const handleCloseClearDialog = (): void => { setShowClearDialog(false); };

  const handleConfirmClear = (): void => {
    // Clear all localStorage persisted stores
    localStorage.removeItem('budget-transactions');
    localStorage.removeItem('budget-rules');
    localStorage.removeItem('budget-preferences');
    setShowClearDialog(false);
    window.location.reload();
  };

  const handleOpenDeleteDialog = (): void => { setShowDeleteDialog(true); };
  const handleCloseDeleteDialog = (): void => {
    setShowDeleteDialog(false);
    setDeletePassword('');
  };

  const handleDeletePasswordChange = (value: string): void => {
    setDeletePassword(value);
  };

  const handleConfirmDelete = (): void => {
    void (async () => {
      const success = await deleteAccount({ password: deletePassword });
      if (success) {
        // Always redirect even if logout request fails — account is already deleted
        try { await logout(); } catch { /* noop */ }
        window.location.href = '/login';
      }
    })();
  };

  return {
    showClearDialog,
    showDeleteDialog,
    isDeleting: deleteState.isLoading,
    deleteError: deleteState.error,
    deletePassword,
    handleOpenClearDialog,
    handleCloseClearDialog,
    handleConfirmClear,
    handleOpenDeleteDialog,
    handleCloseDeleteDialog,
    handleDeletePasswordChange,
    handleConfirmDelete,
  };
};
