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

interface SidebarProps {
  readonly onNavigate?: () => void;
  readonly mobile?: boolean;
}

export const Sidebar = ({ onNavigate, mobile = false }: SidebarProps): React.JSX.Element => {
  const { t } = useTranslation();
  const { data: profile } = useProfileQuery();
  const isSuperuser = profile?.role === 'Superuser';

  return (
    <aside
      className={`sticky top-0 flex h-screen flex-shrink-0 flex-col border-r border-border bg-surface ${mobile ? 'w-[75vw] max-w-[320px]' : 'w-[236px]'}`}
    >
      <SidebarLogo />

      <SectionLabel>{t('nav.overview')}</SectionLabel>

      <nav
        aria-label={t('nav.overview')}
        className="flex flex-col gap-0.5 px-3 pt-1.5"
      >
        <SidebarNavLink mobile={mobile} icon={LayoutGrid} to="/dashboard" onClick={onNavigate}>
          {t('nav.dashboard')}
        </SidebarNavLink>

        <SidebarNavLink
          icon={List}
          to="/transactions"
          onClick={onNavigate}
          mobile={mobile}
        >
          {t('nav.transactions')}
        </SidebarNavLink>

        <SidebarNavLink mobile={mobile} icon={Upload} to="/import" onClick={onNavigate}>
          {t('nav.import')}
        </SidebarNavLink>

        <SidebarNavLink
          icon={History}
          to="/import-history"
          onClick={onNavigate}
          mobile={mobile}
        >
          {t('nav.importHistory')}
        </SidebarNavLink>

        <SidebarNavLink mobile={mobile} icon={Wallet} to="/budgets" onClick={onNavigate}>
          {t('nav.budgets')}
        </SidebarNavLink>

        <SidebarNavLink mobile={mobile} icon={BarChart3} to="/analytics" onClick={onNavigate}>
          {t('nav.analytics')}
        </SidebarNavLink>

        <SidebarNavLink
          icon={SlidersHorizontal}
          to="/admin/rules"
          onClick={onNavigate}
          mobile={mobile}
        >
          {t('nav.rules')}
        </SidebarNavLink>

        {isSuperuser && (
          <SidebarNavLink mobile={mobile} icon={Shield} to="/admin" onClick={onNavigate}>
            {t('nav.admin')}
          </SidebarNavLink>
        )}
      </nav>

      <UserSection />
    </aside>
  );
};
