import type {
  CurrentRecoveryRegistrationAuthority,
  RecoveryRegistrationSnapshot,
} from '@vault-protocol/domain/recovery-registration/types';
import { buildRecoveryRegistration } from '@vault-protocol/testing/build-recovery-registration';

export const buildRecoveryAuthority = (
  overrides: Partial<CurrentRecoveryRegistrationAuthority> = {},
  registration: RecoveryRegistrationSnapshot = buildRecoveryRegistration(),
): CurrentRecoveryRegistrationAuthority => ({
  protocolVersion: '2',
  cryptoSuite: 'HKDF-SHA256/AES-256-GCM',
  userId: registration.userId,
  workspaceId: registration.workspaceId,
  vaultId: registration.vaultId,
  keyId: registration.keyId,
  deviceId: registration.deviceId,
  signingPublicKey: registration.signingPublicKey,
  deviceStatus: 'active',
  isDeviceRevoked: false,
  recoveryPublicKey: undefined,
  ...overrides,
});
