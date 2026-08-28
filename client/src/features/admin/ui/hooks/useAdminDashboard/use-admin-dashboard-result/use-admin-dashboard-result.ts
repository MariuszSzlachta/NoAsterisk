import type { AdminDashboardStats } from '#features/admin/model/types/admin-dashboard-stats';
import type { AdminUserViewModel } from '#features/admin/model/types/admin-user-view-model';
import type { InviteCodeViewModel } from '#features/admin/model/types/invite-code-view-model';
import type { DictionaryDisplayItem } from '#features/admin/ui/hooks/useAdminDashboard/dictionary-display-item';

export type UseAdminDashboardResult =
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly error: string }
  | {
      readonly status: 'loaded';
      readonly stats: AdminDashboardStats;
      readonly recentUsers: readonly AdminUserViewModel[];
      readonly recentCodes: readonly InviteCodeViewModel[];
      readonly dictionaryItems: readonly DictionaryDisplayItem[];
    };
