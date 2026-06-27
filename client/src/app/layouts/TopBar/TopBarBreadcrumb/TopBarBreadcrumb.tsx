import { useTranslation } from 'react-i18next';

interface TopBarBreadcrumbProps {
  readonly breadcrumb: string;
  readonly title: string;
}

export const TopBarBreadcrumb = ({ breadcrumb, title }: TopBarBreadcrumbProps): React.JSX.Element => {
  const { t } = useTranslation();

  return (
    <div className="min-w-0 flex-1">
      <div className="hidden items-center gap-1.5 text-[11px] font-medium text-subtle lg:flex">
        <span>{t('app.name')}</span>
        <span className="text-border-strong">/</span>
        <span className="text-muted-foreground">{breadcrumb}</span>
      </div>
      <h1 className="text-base font-semibold tracking-tight lg:mt-[1px] lg:text-[17px]">{title}</h1>
    </div>
  );
};
