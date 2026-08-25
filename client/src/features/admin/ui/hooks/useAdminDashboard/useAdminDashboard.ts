import { useTranslation } from 'react-i18next';

import { useAdminUsersQuery } from '#features/admin/api/useAdminUsersQuery';
import { useInviteCodesQuery } from '#features/admin/api/useInviteCodesQuery';
import type {
  AdminDashboardStats,
  AdminUserViewModel,
  InviteCodeViewModel,
} from '#features/admin/model/types';

// ─── Types ───────────────────────────────────────────────────────

interface DictionaryDisplayItem {
  readonly label: string;
  readonly count: number;
  readonly lastUpdated: string;
}

type UseAdminDashboardResult =
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly error: string }
  | {
      readonly status: 'loaded';
      readonly stats: AdminDashboardStats;
      readonly recentUsers: readonly AdminUserViewModel[];
      readonly recentCodes: readonly InviteCodeViewModel[];
      readonly dictionaryItems: readonly DictionaryDisplayItem[];
    };

// ─── Hook ────────────────────────────────────────────────────────

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

  // TODO: Fetch real dictionary stats from API when backend endpoint is available
  const dictionaryItems: readonly DictionaryDisplayItem[] = [
    { label: t('admin.dictTypes.firstNames'), count: 2000, lastUpdated: '2 godz. temu' },
    { label: t('admin.dictTypes.surnames'), count: 5000, lastUpdated: '2 godz. temu' },
    { label: t('admin.dictTypes.cities'), count: 950, lastUpdated: '1 dzień temu' },
    { label: t('admin.dictTypes.merchants'), count: 500, lastUpdated: '4 godz. temu' },
    { label: t('admin.dictTypes.phrases'), count: 200, lastUpdated: '6 dni temu' },
  ];

  return { status: 'loaded', stats, recentUsers, recentCodes, dictionaryItems };
};
