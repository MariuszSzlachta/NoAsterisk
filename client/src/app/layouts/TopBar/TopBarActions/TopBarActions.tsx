import { ImportCsvLink } from '#app/layouts/TopBar/ImportCsvLink/ImportCsvLink';
import { NotificationBell } from '#app/layouts/TopBar/NotificationBell/NotificationBell';
import { SearchButton } from '#app/layouts/TopBar/SearchButton/SearchButton';
import { ThemeToggle } from '#shared/ui/ThemeToggle';

export const TopBarActions = (): React.JSX.Element => (
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
);
