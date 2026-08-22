import { Navigate, Outlet } from 'react-router-dom';

import { useProfileQuery } from '#features/user-settings';

import type { UserRole } from '#features/user-settings';

interface RequireRoleProps {
  readonly role: UserRole;
}

export const RequireRole = ({ role }: RequireRoleProps): React.JSX.Element => {
  const { data, isLoading } = useProfileQuery();

  if (isLoading) {
    return <div />;
  }

  if (!data || data.role !== role) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};
