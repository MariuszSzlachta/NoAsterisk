import { useTranslation } from 'react-i18next';
import { Bell } from 'lucide-react';

import { Button } from '#shared/ui/Button';

export const NotificationBell = (): React.JSX.Element => {
  const { t } = useTranslation();

  return (
    <Button
      variant="secondary"
      size="icon"
      aria-label={t('topbar.notifications')}
      className="relative h-[38px] w-[38px]"
    >
      <Bell size={17} aria-hidden="true" />
      <span className="absolute right-[9px] top-[8px] h-[7px] w-[7px] rounded-full border-2 border-surface bg-expense" />
    </Button>
  );
};
