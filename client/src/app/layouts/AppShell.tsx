import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, useLocation } from 'react-router-dom';

import { Sidebar } from '#app/layouts/Sidebar';
import { TopBar } from '#app/layouts/TopBar';
import { FALLBACK_META, ROUTE_META } from '#app/routing/route-meta';

export const AppShell = (): React.JSX.Element => {
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const meta = ROUTE_META[pathname] ?? FALLBACK_META;
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const openSidebar = useCallback((): void => {
    setSidebarOpen(true);
  }, []);

  const closeSidebar = useCallback((): void => {
    setSidebarOpen(false);
  }, []);

  return (
    <div className="flex min-h-screen w-full">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-background/60 backdrop-blur-sm"
            onClick={closeSidebar}
            onKeyDown={closeSidebar}
            role="button"
            tabIndex={-1}
            aria-label={t('nav.closeMenu')}
          />
          <div className="relative z-50">
            <Sidebar onNavigate={closeSidebar} />
          </div>
        </div>
      )}

      <main className="flex max-h-screen min-w-0 flex-1 flex-col overflow-y-auto">
        <TopBar
          breadcrumb={t(meta.breadcrumbKey)}
          title={t(meta.titleKey)}
          onMenuOpen={openSidebar}
        />
        <div className="flex-1 p-4 lg:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
