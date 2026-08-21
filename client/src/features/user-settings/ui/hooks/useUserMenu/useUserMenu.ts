// ═══════════════════════════════════════════════════════════════════
// User Settings — useUserMenu Hook (Zustand store for shared state)
// ═══════════════════════════════════════════════════════════════════

import { useNavigate } from 'react-router-dom';
import { create } from 'zustand';

import { useLogoutMutation } from '#features/user-settings/api/useLogoutMutation';

// ─── Store (shared state between UserSection + UserMenu) ─────────

interface UserMenuState {
  readonly isOpen: boolean;
  readonly toggle: () => void;
  readonly close: () => void;
}

export const useUserMenuStore = create<UserMenuState>((set) => ({
  isOpen: false,
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
  close: () => set({ isOpen: false }),
}));

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
