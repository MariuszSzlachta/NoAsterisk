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
        className="absolute bottom-[70px] left-3 right-3 z-50 rounded-lg border border-border bg-surface-2 p-2 shadow-card lg:p-1"
        role="menu"
        aria-label={t('settings.userMenu.menuLabel')}
      >
        <button
          type="button"
          role="menuitem"
          onClick={handleSettings}
          className="flex min-h-12 w-full items-center gap-3 rounded-md px-3 py-3 text-base text-foreground transition-colors hover:bg-surface-3 lg:min-h-0 lg:gap-2 lg:py-2 lg:text-sm"
        >
          <Settings size={16} className="text-muted-foreground" aria-hidden="true" />
          {t('settings.userMenu.settings')}
        </button>
        <button
          type="button"
          role="menuitem"
          onClick={() => void handleLogout()}
          className="flex min-h-12 w-full items-center gap-3 rounded-md px-3 py-3 text-base text-expense transition-colors hover:bg-surface-3 lg:min-h-0 lg:gap-2 lg:py-2 lg:text-sm"
        >
          <LogOut size={16} aria-hidden="true" />
          {t('settings.userMenu.logout')}
        </button>
      </div>
    </>
  );
};
