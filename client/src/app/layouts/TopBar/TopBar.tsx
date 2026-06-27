import { MobileMenuButton } from '#app/layouts/TopBar/MobileMenuButton/MobileMenuButton';
import { TopBarActions } from '#app/layouts/TopBar/TopBarActions/TopBarActions';
import { TopBarBreadcrumb } from '#app/layouts/TopBar/TopBarBreadcrumb/TopBarBreadcrumb';

interface TopBarProps {
  readonly breadcrumb: string;
  readonly title: string;
  readonly parentPath?: string;
  readonly onMenuOpen: () => void;
}

export const TopBar = ({
  breadcrumb,
  title,
  parentPath,
  onMenuOpen,
}: TopBarProps): React.JSX.Element => (
  <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/86 px-4 backdrop-blur-sm lg:h-[60px] lg:gap-4 lg:px-6">
    <MobileMenuButton onClick={onMenuOpen} />
    <TopBarBreadcrumb
      breadcrumb={breadcrumb}
      title={title}
      parentPath={parentPath}
    />
    <TopBarActions />
  </header>
);
