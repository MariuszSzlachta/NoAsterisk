interface RouteMeta {
  readonly breadcrumbKey: string;
  readonly titleKey: string;
  readonly parentPath?: string;
}

export const ROUTE_META: Record<string, RouteMeta> = {
  '/dashboard': {
    breadcrumbKey: 'breadcrumb.dashboard',
    titleKey: 'titles.dashboard',
  },
  '/transactions': {
    breadcrumbKey: 'breadcrumb.transactions',
    titleKey: 'titles.transactions',
  },
  '/import': { breadcrumbKey: 'breadcrumb.import', titleKey: 'titles.import' },
  '/budgets': {
    breadcrumbKey: 'breadcrumb.budgets',
    titleKey: 'titles.budgets',
  },
  '/analytics': {
    breadcrumbKey: 'breadcrumb.analytics',
    titleKey: 'titles.analytics',
  },
  '/admin/rules': {
    breadcrumbKey: 'breadcrumb.rules',
    titleKey: 'titles.rules',
  },
  '/settings': {
    breadcrumbKey: 'breadcrumb.settings',
    titleKey: 'titles.settings',
  },
};

export const FALLBACK_META: RouteMeta = {
  breadcrumbKey: 'breadcrumb.fallback',
  titleKey: 'titles.fallback',
};
