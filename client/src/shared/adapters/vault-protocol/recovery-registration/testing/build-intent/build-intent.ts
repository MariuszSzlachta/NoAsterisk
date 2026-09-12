import type { RecoveryRegistrationIntent } from '#shared/adapters/vault-protocol/recovery-registration/types';

export const buildRecoveryRegistrationIntent = (
  overrides: Partial<RecoveryRegistrationIntent> = {},
): RecoveryRegistrationIntent => ({
  accountId: 'account',
  workspaceId: 'workspace',
  vaultId: 'vault',
  keyId: 'key',
  deviceId: 'device',
  challenge: 'A'.repeat(43),
  expiresAt: new Date(Date.now() + 50_000).toISOString(),
  signingPublicKey: '{}',
  recoveryPublicKey: 'a'.repeat(64),
  ...overrides,
});
