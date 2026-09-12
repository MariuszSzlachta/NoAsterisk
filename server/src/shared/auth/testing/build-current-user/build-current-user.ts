import type { CurrentUserPayload } from '@shared/auth/current-user';

export const buildCurrentUser = (
  overrides: Partial<CurrentUserPayload> = {},
): CurrentUserPayload => ({
  userId: 'user',
  workspaceId: 'workspace',
  role: 'member',
  authTime: 1000,
  amr: 'password',
  ...overrides,
});
