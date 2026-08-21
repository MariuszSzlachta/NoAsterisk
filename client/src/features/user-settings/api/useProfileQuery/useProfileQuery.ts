// ═══════════════════════════════════════════════════════════════════
// User Settings — Profile Query
// ═══════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useState } from 'react';

import type { PreferencesValues, ProfileData } from '#features/user-settings/model/types';
import { apiClient } from '#shared/api';

// ─── Response Type ───────────────────────────────────────────────

interface ProfileResponse extends ProfileData {
  readonly preferences: PreferencesValues;
}

// ─── Result Interface ────────────────────────────────────────────

interface UseProfileQueryResult {
  readonly data: ProfileResponse | undefined;
  readonly isLoading: boolean;
  readonly error: string | undefined;
  readonly refetch: () => Promise<void>;
}

// ─── Hook ────────────────────────────────────────────────────────

export const useProfileQuery = (): UseProfileQueryResult => {
  const [data, setData] = useState<ProfileResponse | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);

  const fetchProfile = useCallback(async (signal?: AbortSignal): Promise<void> => {
    setIsLoading(true);
    setError(undefined);

    try {
      const response = await apiClient.get<ProfileResponse>('/users/me', { signal });
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
