import {
  LayoutGrid,
  List,
  SlidersHorizontal,
  TrendingUp,
  Upload,
  Wallet,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Badge } from '#shared/ui/Badge';

import { SectionLabel } from './SectionLabel';
import { SidebarNavLink } from './SidebarNavLink';
import { UserSection } from './UserSection';

interface SidebarProps {
  readonly onNavigate?: () => void;
}

export const Sidebar = ({ onNavigate }: SidebarProps): React.JSX.Element => {
  const { t } = useTranslation();

  return (
    <aside className="sticky top-0 flex h-screen w-[236px] flex-shrink-0 flex-col border-r border-border bg-surface">
      {/* Logo */}
      <div className="flex items-center gap-2.5 p-5 pb-[18px]">
        <div className="flex h-[30px] w-[30px] items-center justify-center rounded-[7px] bg-primary">
          <TrendingUp size={17} className="text-primary-foreground" aria-hidden="true" />
        </div>
        <span className="text-[15px] font-semibold tracking-tight text-foreground">
          {t('app.name')}
        </span>
      </div>

      <SectionLabel>{t('nav.overview')}</SectionLabel>

      <nav aria-label={t('nav.overview')} className="flex flex-col gap-0.5 px-3 pt-1.5">
        <SidebarNavLink icon={LayoutGrid} to="/dashboard" onClick={onNavigate}>
          {t('nav.dashboard')}
        </SidebarNavLink>

        <SidebarNavLink
          icon={List}
          to="/transactions"
          onClick={onNavigate}
          trailing={
            // TODO: badge will be dynamic from server state (transaction count)
            <Badge variant="soft" color="neutral" dot={false} className="px-1.5 py-0 text-[11px]">
              245
            </Badge>
          }
        >
          {t('nav.transactions')}
        </SidebarNavLink>

        <SidebarNavLink icon={Upload} to="/import" onClick={onNavigate}>
          {t('nav.import')}
        </SidebarNavLink>

        <SidebarNavLink icon={Wallet} to="/budgets" onClick={onNavigate}>
          {t('nav.budgets')}
        </SidebarNavLink>

        <SidebarNavLink icon={SlidersHorizontal} to="/admin/rules" onClick={onNavigate}>
          {t('nav.rules')}
        </SidebarNavLink>
      </nav>

      <UserSection />
    </aside>
  );
};
