import { DictionariesPanel } from '#features/admin/ui/DictionariesPanel';
import { useAdminDashboard } from '#features/admin/ui/hooks/useAdminDashboard';
import { InviteCodesPanel } from '#features/admin/ui/InviteCodesPanel';
import { UsersOverviewPanel } from '#features/admin/ui/UsersOverviewPanel';
import { Skeleton } from '#shared/ui/Skeleton';

// ─── Props ───────────────────────────────────────────────────────

interface AdminDashboardProps {
  readonly onNavigateToTab: (tabId: string) => void;
}

// ─── Component ───────────────────────────────────────────────────

export const AdminDashboard = ({ onNavigateToTab }: AdminDashboardProps): React.JSX.Element => {
  const { isLoading, stats, recentUsers, recentCodes, dictionaryItems } = useAdminDashboard();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <UsersOverviewPanel
        stats={stats}
        recentUsers={recentUsers}
        onViewAll={onNavigateToTab}
        targetTab="users"
      />
      <InviteCodesPanel
        stats={stats}
        recentCodes={recentCodes}
        onGenerate={onNavigateToTab}
        targetTab="codes"
      />
      <DictionariesPanel
        items={dictionaryItems}
        onManage={onNavigateToTab}
        targetTab="dictionaries"
      />
    </div>
  );
};
