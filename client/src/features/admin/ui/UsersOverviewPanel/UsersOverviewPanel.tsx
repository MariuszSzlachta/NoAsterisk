import { useTranslation } from 'react-i18next';

import type { AdminDashboardStats, AdminUserViewModel } from '#features/admin';
import { Badge } from '#shared/ui/Badge';
import { Button } from '#shared/ui/Button';
import { Card, CardHeader } from '#shared/ui/Card';

// ─── Props ───────────────────────────────────────────────────────

interface UsersOverviewPanelProps {
  readonly stats: AdminDashboardStats;
  readonly recentUsers: readonly AdminUserViewModel[];
  readonly onViewAll: (tabId: string) => void;
  readonly targetTab: string;
}

// ─── Helpers ─────────────────────────────────────────────────────

const ROLE_BADGE_COLOR = {
  Superuser: 'primary',
  Member: 'neutral',
  Blocked: 'expense',
} as const;

// ─── Component ───────────────────────────────────────────────────

export const UsersOverviewPanel = ({
  stats,
  recentUsers,
  onViewAll,
  targetTab,
}: UsersOverviewPanelProps): React.JSX.Element => {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader
        title={t('admin.dashboard.users')}
        action={
          <Button variant="ghost" size="sm" onClick={() => onViewAll(targetTab)}>
            {t('admin.dashboard.viewAll')}
          </Button>
        }
      />

      <div className="mb-4 flex gap-4">
        <div className="flex flex-col">
          <span className="text-xs font-medium uppercase text-muted-foreground">
            {t('admin.dashboard.statAll')}
          </span>
          <span className="text-xl font-bold text-foreground">{stats.totalUsers}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-medium uppercase text-muted-foreground">
            {t('admin.dashboard.statActive')}
          </span>
          <span className="text-xl font-bold text-primary">{stats.activeToday}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-medium uppercase text-muted-foreground">
            {t('admin.dashboard.statBlocked')}
          </span>
          <span className="text-xl font-bold text-expense">{stats.blockedCount}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {recentUsers.map((user) => (
          <div
            key={user.id}
            className="flex items-center justify-between border-b border-border/50 py-2 last:border-0"
          >
            <span className="text-sm text-foreground">{user.email}</span>
            <div className="flex items-center gap-2">
              <Badge variant="soft" color={ROLE_BADGE_COLOR[user.role]} dot={false}>
                {user.role === 'Blocked' ? t('admin.roles.blocked') : user.role}
              </Badge>
              <span className="text-xs text-muted-foreground">{user.createdAt}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
