import { useTranslation } from 'react-i18next';

import { ImportCsvLink } from './ImportCsvLink';
import { MobileMenuButton } from './MobileMenuButton';
import { NotificationBell } from './NotificationBell';
import { SearchButton } from './SearchButton';
import { ThemeToggle } from './ThemeToggle';

interface TopBarProps {
  readonly breadcrumb: string;
  readonly title: string;
  readonly onMenuOpen: () => void;
}

export const TopBar = ({ breadcrumb, title, onMenuOpen }: TopBarProps): React.JSX.Element => {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/86 px-4 backdrop-blur-sm lg:h-[60px] lg:gap-4 lg:px-6">
      <MobileMenuButton onClick={onMenuOpen} />

      <div className="min-w-0 flex-1">
        <div className="hidden items-center gap-1.5 text-[11px] font-medium text-subtle lg:flex">
          <span>{t('app.name')}</span>
          <span className="text-border-strong">/</span>
          <span className="text-muted-foreground">{breadcrumb}</span>
        </div>
        <h1 className="text-base font-semibold tracking-tight lg:mt-[1px] lg:text-[17px]">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden lg:block">
          <SearchButton />
        </div>
        <NotificationBell />
        <ThemeToggle />
        <div className="hidden sm:block">
          <ImportCsvLink />
        </div>
      </div>
    </header>
  );
};
