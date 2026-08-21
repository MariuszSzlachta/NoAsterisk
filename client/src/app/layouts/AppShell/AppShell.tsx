import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, useLocation } from 'react-router-dom';

import { MobileSidebarOverlay } from '#app/layouts/AppShell/MobileSidebarOverlay/MobileSidebarOverlay';
import { Sidebar } from '#app/layouts/Sidebar';
import { TopBar } from '#app/layouts/TopBar';
import { FALLBACK_META, ROUTE_META } from '#app/routing/route-meta';
import { RestoreOnLoginGuard } from '#features/user-settings';
import { ToastContainer } from '#shared/ui/Toast';

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
    <div className="flex h-screen w-full">
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {sidebarOpen && <MobileSidebarOverlay onClose={closeSidebar} />}

      <main className="flex max-h-screen min-w-0 flex-1 flex-col overflow-hidden">
        <TopBar
          breadcrumb={t(meta.breadcrumbKey)}
          title={t(meta.titleKey)}
          parentPath={meta.parentPath}
          onMenuOpen={openSidebar}
        />
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </div>
      </main>

      <ToastContainer />
      <RestoreOnLoginGuard />
    </div>
  );
};
