import { useTranslation } from 'react-i18next';

import { productIdentity } from '#shared/config/product-identity/product-identity';

export const SidebarLogo = (): React.JSX.Element => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-2.5 p-5 pb-[18px]">
      <img
        src={productIdentity.markPath}
        alt=""
        aria-hidden="true"
        className="h-[30px] w-[30px]"
      />
      <span className="text-[15px] font-semibold tracking-tight text-foreground">
        {t('app.name')}
      </span>
    </div>
  );
};
