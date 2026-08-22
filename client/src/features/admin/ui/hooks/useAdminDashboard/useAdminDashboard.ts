import { useTranslation } from 'react-i18next';

import { useAdminUsersQuery, useInviteCodesQuery } from '#features/admin';

import type {
  AdminDashboardStats,
  AdminUserViewModel,
  InviteCodeViewModel,
} from '#features/admin';

// ─── Types ───────────────────────────────────────────────────────

interface DictionaryDisplayItem {
  readonly label: string;
  readonly count: number;
  readonly lastUpdated: string;
}

interface UseAdminDashboardResult {
  readonly isLoading: boolean;
  readonly stats: AdminDashboardStats;
  readonly recentUsers: readonly AdminUserViewModel[];
  readonly recentCodes: readonly InviteCodeViewModel[];
  readonly dictionaryItems: readonly DictionaryDisplayItem[];
}

// ─── Hook ────────────────────────────────────────────────────────

export const useAdminDashboard = (): UseAdminDashboardResult => {
  const { t } = useTranslation();
  const usersQuery = useAdminUsersQuery();
  const codesQuery = useInviteCodesQuery();

  const isLoading = usersQuery.status === 'loading' || codesQuery.status === 'loading';

  const users: readonly AdminUserViewModel[] =
    usersQuery.status === 'loaded' ? usersQuery.data.users : [];

  const codes: readonly InviteCodeViewModel[] =
    codesQuery.status === 'loaded' ? codesQuery.data.codes : [];

  const stats: AdminDashboardStats = {
    totalUsers: users.length,
    activeToday: users.filter((u) => u.role !== 'Blocked').length,
    blockedCount: users.filter((u) => u.role === 'Blocked').length,
    availableCodes: codes.filter((c) => c.status === 'Available').length,
    usedCodes: codes.filter((c) => c.status === 'Used').length,
  };

  const recentUsers = users.slice(0, 5);
  const recentCodes = codes.slice(0, 5);

  // TODO: Fetch real dictionary stats from API when backend endpoint is available
  const dictionaryItems: readonly DictionaryDisplayItem[] = [
    { label: t('admin.dictTypes.firstNames'), count: 2000, lastUpdated: '2 godz. temu' },
    { label: t('admin.dictTypes.surnames'), count: 5000, lastUpdated: '2 godz. temu' },
    { label: t('admin.dictTypes.cities'), count: 950, lastUpdated: '1 dzień temu' },
    { label: t('admin.dictTypes.merchants'), count: 500, lastUpdated: '4 godz. temu' },
    { label: t('admin.dictTypes.phrases'), count: 200, lastUpdated: '6 dni temu' },
  ];

  return { isLoading, stats, recentUsers, recentCodes, dictionaryItems };
};
