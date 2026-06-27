import { Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useTheme } from '#app/providers/useTheme';
import { Button } from '#shared/ui/Button';

export const ThemeToggle = (): React.JSX.Element => {
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();

  const label = theme === 'dark' ? t('topbar.themeLight') : t('topbar.themeDark');
  const icon = theme === 'dark'
    ? <Moon size={17} aria-hidden="true" />
    : <Sun size={17} aria-hidden="true" />;

  return (
    <Button
      variant="secondary"
      size="icon"
      onClick={toggleTheme}
      aria-label={label}
      className="h-[38px] w-[38px]"
    >
      {icon}
    </Button>
  );
};
