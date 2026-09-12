import type { RecoveryRegistrationSnapshot } from '@vault-protocol/domain/recovery-registration/types';

export const buildRecoveryRegistration = (
  overrides: Partial<RecoveryRegistrationSnapshot> = {},
): RecoveryRegistrationSnapshot => ({
  id: '00000000-0000-4000-8000-000000000001',
  userId: '00000000-0000-4000-8000-000000000002',
  workspaceId: '00000000-0000-4000-8000-000000000003',
  vaultId: '00000000-0000-4000-8000-000000000004',
  keyId: 'test-key',
  deviceId: 'test-device',
  challenge: 'A'.repeat(43),
  signingPublicKey: '{"fixture":"public-device-key"}',
  recoveryPublicKey:
    'd75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a',
  createdAt: 1_000,
  expiresAt: 61_000,
  ...overrides,
});
