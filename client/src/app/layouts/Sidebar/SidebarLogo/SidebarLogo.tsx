import { TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const SidebarLogo = (): React.JSX.Element => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-2.5 p-5 pb-[18px]">
      <div className="flex h-[30px] w-[30px] items-center justify-center rounded-[7px] bg-primary">
        <TrendingUp size={17} className="text-primary-foreground" aria-hidden="true" />
      </div>
      <span className="text-[15px] font-semibold tracking-tight text-foreground">
        {t('app.name')}
      </span>
    </div>
  );
};
