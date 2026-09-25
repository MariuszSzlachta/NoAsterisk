import { Navigate, Outlet } from 'react-router-dom';

import { AppShellSkeleton } from '#app/layouts/AppShell/AppShellSkeleton';
import { useAuthBootstrap } from '#app/routing/useAuthBootstrap';

export const RequireAuth = (): React.JSX.Element => {
  const { isAuthenticated, isBootstrapped } = useAuthBootstrap();

  if (!isBootstrapped) {
    return <AppShellSkeleton />;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};
