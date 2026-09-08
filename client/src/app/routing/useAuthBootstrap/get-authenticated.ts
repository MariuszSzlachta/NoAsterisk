import { authTokens } from '#shared/api/auth-tokens';

export const getAuthenticated = (): boolean => authTokens.getAccessToken() !== undefined;
