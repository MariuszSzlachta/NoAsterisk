import type { ProfileResponse } from '#features/user-settings/api/useProfileQuery/profile-response';

export interface UseProfileQueryResult {
  readonly data: ProfileResponse | undefined;
  readonly isLoading: boolean;
  readonly error: string | undefined;
  readonly refetch: () => Promise<void>;
}
