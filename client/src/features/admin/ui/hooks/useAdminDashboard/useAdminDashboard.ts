import { useTranslation } from 'react-i18next';

import { useAdminUsersQuery } from '#features/admin/api/useAdminUsersQuery';
import { useInviteCodesQuery } from '#features/admin/api/useInviteCodesQuery';
import type { AdminDashboardStats } from '#features/admin/model/types/admin-dashboard-stats';
import type { AdminUserViewModel } from '#features/admin/model/types/admin-user-view-model';
import type { InviteCodeViewModel } from '#features/admin/model/types/invite-code-view-model';

import type { DictionaryDisplayItem } from '#features/admin/ui/hooks/useAdminDashboard/dictionary-display-item';
import type { UseAdminDashboardResult } from '#features/admin/ui/hooks/useAdminDashboard/use-admin-dashboard-result';

export const useAdminDashboard = (): UseAdminDashboardResult => {
  const { t } = useTranslation();
  const usersQuery = useAdminUsersQuery();
  const codesQuery = useInviteCodesQuery();

  if (usersQuery.status === 'loading' || codesQuery.status === 'loading') {
    return { status: 'loading' };
  }

  if (usersQuery.status === 'error') {
    return { status: 'error', error: usersQuery.error };
  }

  if (codesQuery.status === 'error') {
    return { status: 'error', error: codesQuery.error };
  }

  if (usersQuery.status === 'notLoaded' || codesQuery.status === 'notLoaded') {
    return { status: 'loading' };
  }

  const users: readonly AdminUserViewModel[] = usersQuery.data.users;

  const codes: readonly InviteCodeViewModel[] = codesQuery.data.codes.map((code) => ({
    ...code,
    expiresAt: code.expiresAt ?? undefined,
    usedBy: code.usedBy ?? undefined,
    usedAt: code.usedAt ?? undefined,
  }));

  const stats: AdminDashboardStats = {
    totalUsers: users.length,
    activeToday: users.filter((u) => u.role !== 'Blocked').length,
    blockedCount: users.filter((u) => u.role === 'Blocked').length,
    availableCodes: codes.filter((c) => c.status === 'Available').length,
    usedCodes: codes.filter((c) => c.status === 'Used').length,
  };

  const recentUsers = users.slice(0, 5);
  const recentCodes = codes.slice(0, 5);

  /** TODO: Fetch real dictionary stats from API when backend endpoint is available */
  const dictionaryItems: readonly DictionaryDisplayItem[] = [
    { label: t('admin.dictTypes.firstNames'), count: 2000, lastUpdated: '2 godz. temu' },
    { label: t('admin.dictTypes.surnames'), count: 5000, lastUpdated: '2 godz. temu' },
    { label: t('admin.dictTypes.cities'), count: 950, lastUpdated: '1 dzień temu' },
    { label: t('admin.dictTypes.merchants'), count: 500, lastUpdated: '4 godz. temu' },
    { label: t('admin.dictTypes.phrases'), count: 200, lastUpdated: '6 dni temu' },
  ];

  return { status: 'loaded', stats, recentUsers, recentCodes, dictionaryItems };
};
