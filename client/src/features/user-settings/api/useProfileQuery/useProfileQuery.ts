import { USERS_ME_PATH } from '#features/user-settings/api/constants/users-me-path';
import type { ProfileResponse } from '#features/user-settings/api/useProfileQuery/profile-response';
import type { UseProfileQueryResult } from '#features/user-settings/api/useProfileQuery/use-profile-query-result';

import { useCallback, useEffect, useRef, useState } from 'react';

import { apiClient } from '#shared/api';

let profileRequest: Promise<ProfileResponse> | undefined;

const requestProfile = (): Promise<ProfileResponse> => {
  profileRequest ??= apiClient.get<ProfileResponse>(USERS_ME_PATH).finally(() => {
    profileRequest = undefined;
  });
  return profileRequest;
};

export const useProfileQuery = (): UseProfileQueryResult => {
  const [data, setData] = useState<ProfileResponse | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const isMounted = useRef(false);

  const fetchProfile = useCallback(async (): Promise<void> => {
    if (isMounted.current) {
      setIsLoading(true);
      setError(undefined);
    }

    try {
      const response = await requestProfile();
      if (isMounted.current) {
        setData(response);
      }
    } catch {
      if (isMounted.current) {
        setError('Nie udało się pobrać profilu');
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    void fetchProfile();
    return () => {
      isMounted.current = false;
    };
  }, [fetchProfile]);

  return { data, isLoading, error, refetch: fetchProfile };
};
