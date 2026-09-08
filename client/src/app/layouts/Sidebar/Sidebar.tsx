import { useTranslation } from 'react-i18next';
import {
  BarChart3,
  History,
  LayoutGrid,
  List,
  Shield,
  SlidersHorizontal,
  Upload,
  Wallet,
} from 'lucide-react';

import { SectionLabel } from '#app/layouts/Sidebar/SectionLabel/SectionLabel';
import { SidebarLogo } from '#app/layouts/Sidebar/SidebarLogo/SidebarLogo';
import { SidebarNavLink } from '#app/layouts/Sidebar/SidebarNavLink/SidebarNavLink';
import { UserSection } from '#app/layouts/Sidebar/UserSection/UserSection';
import { useProfileQuery } from '#features/user-settings';
import { Badge } from '#shared/ui/Badge';

interface SidebarProps {
  readonly onNavigate?: () => void;
}

export const Sidebar = ({ onNavigate }: SidebarProps): React.JSX.Element => {
  const { t } = useTranslation();
  const { data: profile } = useProfileQuery();
  const isSuperuser = profile?.role === 'Superuser';

  return (
    <aside className="sticky top-0 flex h-screen w-[236px] flex-shrink-0 flex-col border-r border-border bg-surface">
      <SidebarLogo />

      <SectionLabel>{t('nav.overview')}</SectionLabel>

      <nav
        aria-label={t('nav.overview')}
        className="flex flex-col gap-0.5 px-3 pt-1.5"
      >
        <SidebarNavLink icon={LayoutGrid} to="/dashboard" onClick={onNavigate}>
          {t('nav.dashboard')}
        </SidebarNavLink>

        <SidebarNavLink
          icon={List}
          to="/transactions"
          onClick={onNavigate}
          trailing={
            // TODO: badge will be dynamic from server state (transaction count)
            <Badge
              variant="soft"
              color="neutral"
              dot={false}
              className="px-1.5 py-0 text-[11px]"
            >
              245
            </Badge>
          }
        >
          {t('nav.transactions')}
        </SidebarNavLink>

        <SidebarNavLink icon={Upload} to="/import" onClick={onNavigate}>
          {t('nav.import')}
        </SidebarNavLink>

        <SidebarNavLink
          icon={History}
          to="/import-history"
          onClick={onNavigate}
        >
          {t('nav.importHistory')}
        </SidebarNavLink>

        <SidebarNavLink icon={Wallet} to="/budgets" onClick={onNavigate}>
          {t('nav.budgets')}
        </SidebarNavLink>

        <SidebarNavLink icon={BarChart3} to="/analytics" onClick={onNavigate}>
          {t('nav.analytics')}
        </SidebarNavLink>

        <SidebarNavLink
          icon={SlidersHorizontal}
          to="/admin/rules"
          onClick={onNavigate}
        >
          {t('nav.rules')}
        </SidebarNavLink>

        {isSuperuser && (
          <SidebarNavLink icon={Shield} to="/admin" onClick={onNavigate}>
            {t('nav.admin')}
          </SidebarNavLink>
        )}
      </nav>

      <UserSection />
    </aside>
  );
};
