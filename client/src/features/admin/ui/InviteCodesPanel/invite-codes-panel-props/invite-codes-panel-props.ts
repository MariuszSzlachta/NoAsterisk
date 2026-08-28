import type { AdminDashboardStats } from '#features/admin/model/types/admin-dashboard-stats';
import type { InviteCodeViewModel } from '#features/admin/model/types/invite-code-view-model';

export interface InviteCodesPanelProps {
  readonly stats: AdminDashboardStats;
  readonly recentCodes: readonly InviteCodeViewModel[];
  readonly onGenerate: (tabId: string) => void;
  readonly targetTab: string;
}
