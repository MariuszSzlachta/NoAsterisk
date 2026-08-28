import type { AdminDashboardStats } from '#features/admin/model/types/admin-dashboard-stats';
import type { AdminUserViewModel } from '#features/admin/model/types/admin-user-view-model';

export interface UsersOverviewPanelProps {
  readonly stats: AdminDashboardStats;
  readonly recentUsers: readonly AdminUserViewModel[];
  readonly onViewAll: (tabId: string) => void;
  readonly targetTab: string;
}
