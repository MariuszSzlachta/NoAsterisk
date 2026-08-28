import { useTranslation } from 'react-i18next';

import { DictionariesPanel } from '#features/admin/ui/DictionariesPanel';
import { useAdminDashboard } from '#features/admin/ui/hooks/useAdminDashboard';
import { InviteCodesPanel } from '#features/admin/ui/InviteCodesPanel';
import { UsersOverviewPanel } from '#features/admin/ui/UsersOverviewPanel';
import { Skeleton } from '#shared/ui/Skeleton';

import type { AdminDashboardProps } from '#features/admin/ui/AdminDashboard/admin-dashboard-props';

export const AdminDashboard = ({ onNavigateToTab }: AdminDashboardProps): React.JSX.Element => {
  const { t } = useTranslation();
  const dashboardState = useAdminDashboard();

  if (dashboardState.status === 'loading') {
    return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
    );
  }

  if (dashboardState.status === 'error') {
    return (
      <div className="rounded-md bg-expense-soft px-4 py-3" role="alert">
        <p className="text-sm text-expense">{t('common.error', { defaultValue: dashboardState.error })}</p>
      </div>
    );
  }

  const { stats, recentUsers, recentCodes, dictionaryItems } = dashboardState;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <UsersOverviewPanel stats={stats} recentUsers={recentUsers} onViewAll={onNavigateToTab} targetTab="users" />
      <InviteCodesPanel stats={stats} recentCodes={recentCodes} onGenerate={onNavigateToTab} targetTab="codes" />
      <DictionariesPanel items={dictionaryItems} onManage={onNavigateToTab} targetTab="dictionaries" />
    </div>
  );
};
