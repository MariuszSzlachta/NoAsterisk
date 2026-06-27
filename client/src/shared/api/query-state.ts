export type QueryState<TData> =
  | { readonly status: 'notLoaded' }
  | { readonly status: 'loading' }
  | { readonly status: 'loaded'; readonly data: TData }
  | { readonly status: 'error'; readonly error: string };
