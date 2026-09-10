import { useTranslation } from 'react-i18next';

import { Sidebar } from '#app/layouts/Sidebar';

interface MobileSidebarOverlayProps {
  onClose: () => void;
}

export const MobileSidebarOverlay = ({
  onClose,
}: MobileSidebarOverlayProps): React.JSX.Element => {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-40 lg:hidden">
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-background/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label={t('nav.closeMenu')}
      />
      <div className="relative z-50">
        <Sidebar mobile onNavigate={onClose} />
      </div>
    </div>
  );
};
