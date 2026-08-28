// User Settings — UserMenu Component (dropdown for sidebar)

import { LogOut, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useUserMenu } from '#features/user-settings/ui/hooks/useUserMenu';


export const UserMenu = (): React.JSX.Element | null => {
  const { t } = useTranslation();
  const { isOpen, handleClose, handleSettings, handleLogout } = useUserMenu();

  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={handleClose}
        role="presentation"
      />

      {/* Menu Panel */}
      <div
        className="absolute bottom-[70px] left-3 right-3 z-50 rounded-lg border border-border bg-surface-2 p-1 shadow-card"
        role="menu"
        aria-label={t('settings.userMenu.menuLabel')}
      >
        <button
          type="button"
          role="menuitem"
          onClick={handleSettings}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground transition-colors hover:bg-surface-3"
        >
          <Settings size={14} className="text-muted-foreground" aria-hidden="true" />
          {t('settings.userMenu.settings')}
        </button>
        <button
          type="button"
          role="menuitem"
          onClick={() => void handleLogout()}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-expense transition-colors hover:bg-surface-3"
        >
          <LogOut size={14} aria-hidden="true" />
          {t('settings.userMenu.logout')}
        </button>
      </div>
    </>
  );
};
