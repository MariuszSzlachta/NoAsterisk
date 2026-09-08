/**
 * In-memory token store. Tokens are NEVER persisted to localStorage.
 * Access token lives only in module-scoped variable.
 * Refresh token should be in httpOnly cookie (set by backend).
 */

let accessToken: string | undefined;

export const authTokens = {
  getAccessToken: (): string | undefined => accessToken,

  setAccessToken: (token: string | undefined): void => {
    accessToken = token;
    if (token) {
      window.dispatchEvent(new CustomEvent('auth:login'));
    }
  },

  clear: (): void => {
    accessToken = undefined;
    window.dispatchEvent(new CustomEvent('auth:session-expired'));
  },
};
