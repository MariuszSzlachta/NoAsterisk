import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { ROUTE_META } from '#app/routing/route-meta';

interface TopBarBreadcrumbProps {
  readonly breadcrumb: string;
  readonly title: string;
  readonly parentPath?: string;
}

export const TopBarBreadcrumb = ({
  breadcrumb,
  title,
  parentPath,
}: TopBarBreadcrumbProps): React.JSX.Element => {
  const { t } = useTranslation();

  const parentMeta = parentPath ? ROUTE_META[parentPath] : undefined;

  return (
    <div className="min-w-0 flex-1">
      <nav
        aria-label="Breadcrumb"
        className="hidden items-center gap-1.5 text-[11px] font-medium text-subtle lg:flex"
      >
        <span>{t('app.name')}</span>
        {parentPath && parentMeta && (
          <>
            <span className="text-border-strong">/</span>
            <Link
              to={parentPath}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {t(parentMeta.breadcrumbKey)}
            </Link>
          </>
        )}
        <span className="text-border-strong">/</span>
        <span className="text-muted-foreground">{breadcrumb}</span>
      </nav>
      <h1 className="text-base font-semibold tracking-tight lg:mt-[1px] lg:text-[17px]">
        {title}
      </h1>
    </div>
  );
};
