export type RolloverOption =
  | { readonly type: 'carry_forward' }
  | { readonly type: 'savings'; readonly targetBudgetId: string }
  | { readonly type: 'discard' };
