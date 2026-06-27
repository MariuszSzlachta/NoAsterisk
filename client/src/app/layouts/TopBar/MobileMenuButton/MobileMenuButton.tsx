import { useTranslation } from 'react-i18next';
import { Menu } from 'lucide-react';

import { Button } from '#shared/ui/Button';

interface MobileMenuButtonProps {
  readonly onClick: () => void;
}

export const MobileMenuButton = ({
  onClick,
}: MobileMenuButtonProps): React.JSX.Element => {
  const { t } = useTranslation();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      aria-label={t('nav.openMenu')}
      className="h-[38px] w-[38px] lg:hidden"
    >
      <Menu size={20} aria-hidden="true" />
    </Button>
  );
};
