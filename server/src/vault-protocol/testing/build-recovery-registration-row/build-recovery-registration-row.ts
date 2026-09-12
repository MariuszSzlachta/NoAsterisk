import type { vaultRecoveryAuthorityChallenges } from '@shared/infrastructure/database/schema';
import { buildRecoveryRegistration } from '@vault-protocol/testing/build-recovery-registration';

export const buildRecoveryRegistrationRow = (
  overrides: Partial<typeof vaultRecoveryAuthorityChallenges.$inferSelect> = {},
): typeof vaultRecoveryAuthorityChallenges.$inferSelect => {
  const snapshot = buildRecoveryRegistration();
  return {
    ...snapshot,
    createdAt: new Date(snapshot.createdAt),
    expiresAt: new Date(snapshot.expiresAt),
    consumedAt: null,
    ...overrides,
  };
};
