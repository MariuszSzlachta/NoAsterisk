// ═══════════════════════════════════════════════════════════════════
// User Settings — useUserMenu Hook
// ═══════════════════════════════════════════════════════════════════

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useLogoutMutation } from '#features/user-settings/api/useLogoutMutation';

// ─── Result Interface ────────────────────────────────────────────

interface UseUserMenuResult {
  readonly isOpen: boolean;
  readonly handleToggle: () => void;
  readonly handleClose: () => void;
  readonly handleSettings: () => void;
  readonly handleLogout: () => Promise<void>;
}

// ─── Hook ────────────────────────────────────────────────────────

export const useUserMenu = (): UseUserMenuResult => {
  const navigate = useNavigate();
  const { mutateAsync: logout } = useLogoutMutation();

  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = (): void => { setIsOpen((prev) => !prev); };
  const handleClose = (): void => { setIsOpen(false); };

  const handleSettings = (): void => {
    setIsOpen(false);
    navigate('/settings');
  };

  const handleLogout = async (): Promise<void> => {
    setIsOpen(false);
    await logout();
    navigate('/login');
  };

  return {
    isOpen,
    handleToggle,
    handleClose,
    handleSettings,
    handleLogout,
  };
};
