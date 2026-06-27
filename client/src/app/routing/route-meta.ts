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
  '/reports/balance': { breadcrumbKey: 'breadcrumb.reportBalance', titleKey: 'titles.reportBalance' },
  '/reports/income': { breadcrumbKey: 'breadcrumb.reportIncome', titleKey: 'titles.reportIncome' },
  '/reports/expenses': { breadcrumbKey: 'breadcrumb.reportExpenses', titleKey: 'titles.reportExpenses' },
  '/reports/savings': { breadcrumbKey: 'breadcrumb.reportSavings', titleKey: 'titles.reportSavings' },
};

export const FALLBACK_META: RouteMeta = {
  breadcrumbKey: 'breadcrumb.fallback',
  titleKey: 'titles.fallback',
};
