import { useState } from 'react';

import { USERS_ME_LOGOUT_PATH } from '#features/user-settings/api/constants/users-me-logout-path';
import type { MutationState } from '#features/user-settings/api/useLogoutMutation/mutation-state';
import type { UseLogoutMutationResult } from '#features/user-settings/api/useLogoutMutation/use-logout-mutation-result';
import { encryptedPersistence } from '#shared/adapters/persistence';
import { passkeyUnlockHandoff } from '#shared/adapters/webauthn/passkey-unlock-handoff';
import { apiClient } from '#shared/api';
import { authTokens } from '#shared/api/auth-tokens';

export const useLogoutMutation = (): UseLogoutMutationResult => {
  const [state, setState] = useState<MutationState>({
    isLoading: false,
    error: undefined,
  });

  const mutateAsync = async (): Promise<boolean> => {
    setState({ isLoading: true, error: undefined });

    try {
      await apiClient.post<Record<string, never>, Record<string, never>>(
        USERS_ME_LOGOUT_PATH,
        {},
      );
    } catch {}

    try {
      encryptedPersistence.lock();
    } catch {}

    authTokens.clear();
    passkeyUnlockHandoff.clear();
    setState({ isLoading: false, error: undefined });
    return true;
  };

  const reset = (): void => {
    setState({ isLoading: false, error: undefined });
  };

  return { state, mutateAsync, reset };
};
