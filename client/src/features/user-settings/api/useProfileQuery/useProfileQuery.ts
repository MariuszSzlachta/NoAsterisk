import { USERS_ME_PATH } from '#features/user-settings/api/constants/users-me-path';
import type { ProfileResponse } from '#features/user-settings/api/useProfileQuery/profile-response';
import type { UseProfileQueryResult } from '#features/user-settings/api/useProfileQuery/use-profile-query-result';

import { useCallback, useEffect, useState } from 'react';

import type { PreferencesValues } from '#features/user-settings/model/types/preferences-values';
import type { ProfileData } from '#features/user-settings/model/types/profile-data';
import { apiClient } from '#shared/api';

export const useProfileQuery = (): UseProfileQueryResult => {
  const [data, setData] = useState<ProfileResponse | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);

  const fetchProfile = useCallback(async (signal?: AbortSignal): Promise<void> => {
    setIsLoading(true);
    setError(undefined);

    try {
      const response = await apiClient.get<ProfileResponse>(USERS_ME_PATH, { signal });
      setData(response);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      setError('Nie udało się pobrać profilu');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void fetchProfile(controller.signal);
    return () => { controller.abort(); };
  }, [fetchProfile]);

  return { data, isLoading, error, refetch: fetchProfile };
};
