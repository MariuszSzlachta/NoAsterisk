interface RouteMeta {
  readonly breadcrumbKey: string;
  readonly titleKey: string;
}

export const ROUTE_META: Record<string, RouteMeta> = {
  '/dashboard': { breadcrumbKey: 'breadcrumb.dashboard', titleKey: 'titles.dashboard' },
  '/transactions': { breadcrumbKey: 'breadcrumb.transactions', titleKey: 'titles.transactions' },
  '/import': { breadcrumbKey: 'breadcrumb.import', titleKey: 'titles.import' },
  '/budgets': { breadcrumbKey: 'breadcrumb.budgets', titleKey: 'titles.budgets' },
  '/admin/rules': { breadcrumbKey: 'breadcrumb.rules', titleKey: 'titles.rules' },
};

export const FALLBACK_META: RouteMeta = {
  breadcrumbKey: 'breadcrumb.fallback',
  titleKey: 'titles.fallback',
};
