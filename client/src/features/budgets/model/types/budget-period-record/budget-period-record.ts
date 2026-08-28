export type BudgetPeriodRecord =
  | { readonly type: 'monthly' }
  | { readonly type: 'yearly' }
  | { readonly type: 'custom'; readonly dateFrom: string; readonly dateTo: string };
