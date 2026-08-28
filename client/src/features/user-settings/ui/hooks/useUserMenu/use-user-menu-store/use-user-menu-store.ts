import { create } from 'zustand';

import type { UserMenuState } from '#features/user-settings/ui/hooks/useUserMenu/user-menu-state';

export const useUserMenuStore = create<UserMenuState>((set) => ({
  isOpen: false,
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
  close: () => set({ isOpen: false }),
}));
