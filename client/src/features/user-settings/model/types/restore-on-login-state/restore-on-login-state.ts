export type RestoreOnLoginState =
  | { readonly status: 'hidden' }
  | { readonly status: 'prompt' }
  | { readonly status: 'restoring' }
  | { readonly status: 'error'; readonly message: string }
  | { readonly status: 'dismissed' };
