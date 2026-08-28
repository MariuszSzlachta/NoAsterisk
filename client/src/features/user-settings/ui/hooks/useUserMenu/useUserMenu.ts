// User Settings — useUserMenu Hook (Zustand store for shared state)

import { useNavigate } from 'react-router-dom';

import { useLogoutMutation } from '#features/user-settings/api/useLogoutMutation';
import type { UseUserMenuResult } from '#features/user-settings/ui/hooks/useUserMenu/use-user-menu-result';
import { useUserMenuStore } from '#features/user-settings/ui/hooks/useUserMenu/use-user-menu-store';

export const useUserMenu = (): UseUserMenuResult => {
  const navigate = useNavigate();
  const { mutateAsync: logout } = useLogoutMutation();

  const isOpen = useUserMenuStore((s) => s.isOpen);
  const toggle = useUserMenuStore((s) => s.toggle);
  const close = useUserMenuStore((s) => s.close);

  const handleToggle = (): void => { toggle(); };
  const handleClose = (): void => { close(); };

  const handleSettings = (): void => {
    close();
    navigate('/settings');
  };

  const handleLogout = async (): Promise<void> => {
    close();
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
