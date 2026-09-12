import type { ConfirmRecoveryRegistrationCommand } from '@vault-protocol/application/commands/confirm-recovery-registration';
import { buildRecoveryRegistration } from '@vault-protocol/testing/build-recovery-registration';

export const buildRecoveryRegistrationCommand = (
  overrides: Partial<ConfirmRecoveryRegistrationCommand> = {},
): ConfirmRecoveryRegistrationCommand => {
  const snapshot = buildRecoveryRegistration();
  return {
    user: {
      userId: snapshot.userId,
      workspaceId: snapshot.workspaceId,
      role: 'Member',
      authTime: Date.now(),
      amr: 'password',
    },
    vaultId: snapshot.vaultId,
    keyId: snapshot.keyId,
    deviceId: snapshot.deviceId,
    challenge: snapshot.challenge,
    deviceSignature: 'a'.repeat(128),
    recoverySignature: 'b'.repeat(128),
    ...overrides,
  };
};
