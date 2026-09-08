import { useEffect, useState, useSyncExternalStore } from 'react';

import { subscribeToAuthSession } from '#app/routing/useAuthBootstrap/auth-session-subscriber';
import { getAuthenticated } from '#app/routing/useAuthBootstrap/get-authenticated';
import { REFRESH_ENDPOINT } from '#features/auth/api/constants/refresh-endpoint';
import { apiClient } from '#shared/api';
import { authTokens } from '#shared/api/auth-tokens';

interface AuthBootstrapState {
  readonly isAuthenticated: boolean;
  readonly isBootstrapped: boolean;
}

export const useAuthBootstrap = (): AuthBootstrapState => {
  const isAuthenticated = useSyncExternalStore(
    subscribeToAuthSession,
    getAuthenticated,
    getAuthenticated,
  );
  const [isBootstrapped, setIsBootstrapped] = useState(isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      setIsBootstrapped(true);
      return;
    }

    let isMounted = true;
    void apiClient
      .post<unknown, Record<string, never>>(
        REFRESH_ENDPOINT,
        {},
        { skipAuth: true },
      )
      .then((response) => {
        if (
          typeof response === 'object' &&
          response !== null &&
          'accessToken' in response &&
          typeof response.accessToken === 'string' &&
          response.accessToken.length > 0
        ) {
          authTokens.setAccessToken(response.accessToken);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (isMounted) {
          setIsBootstrapped(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  return { isAuthenticated, isBootstrapped };
};
