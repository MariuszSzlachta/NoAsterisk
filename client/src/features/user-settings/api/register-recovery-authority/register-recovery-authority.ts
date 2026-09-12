import { VAULT_NETWORK_TIMEOUT_MS } from '#features/user-settings/api/constants/vault-network-timeout';
import { readRecoveryUpgradeBootstrap } from '#features/user-settings/api/read-recovery-upgrade-bootstrap';
import type { RecoveryAuthorityRegistration } from '#features/user-settings/api/register-recovery-authority/types';
import { verifyRecoveryRegistrationAuthority } from '#features/user-settings/api/verify-recovery-registration-authority';
import { encryptedPersistence } from '#shared/adapters/persistence';
import { createVaultAbortScope } from '#shared/adapters/persistence/session/create-vault-abort-scope';
import { signEnrollmentDeviceMessage } from '#shared/adapters/vault-protocol/enrollment-transcript/sign-device-message';
import {
  deriveRecoveryPublicKey,
  signRecoveryMessage,
} from '#shared/adapters/vault-protocol/recovery-authority';
import { encodeRecoveryRegistration } from '#shared/adapters/vault-protocol/recovery-registration/encode';
import { confirmRecoveryRegistration } from '#shared/api/vault-protocol/recovery-registration/confirm';
import { prepareRecoveryRegistration } from '#shared/api/vault-protocol/recovery-registration/prepare';
import { bytesToHex } from '#shared/lib/bytes-to-hex';

export const registerRecoveryAuthority = async (
  registration: RecoveryAuthorityRegistration,
): Promise<void> => {
  const { context, recoverySeed, signingKey, signingPublicKey } = registration;
  registration.assertCurrent();
  const recoveryPublicKey = bytesToHex(deriveRecoveryPublicKey(recoverySeed));
  const scope = createVaultAbortScope(
    encryptedPersistence,
    VAULT_NETWORK_TIMEOUT_MS,
  );
  const assertCurrent = (): void => {
    scope.assertCurrent();
    registration.assertCurrent();
  };
  try {
    const intent = await prepareRecoveryRegistration(
      { ...context, recoveryPublicKey },
      scope.signal,
    );
    assertCurrent();
    await verifyRecoveryRegistrationAuthority(
      intent,
      signingPublicKey,
      assertCurrent,
    );
    assertCurrent();
    const message = encodeRecoveryRegistration(intent);
    const deviceSignature = await signEnrollmentDeviceMessage(
      signingKey,
      message,
    );
    assertCurrent();
    if (Date.parse(intent.expiresAt) <= Date.now())
      throw new Error('Recovery registration expired');
    await confirmRecoveryRegistration(
      {
        vaultId: intent.vaultId,
        keyId: intent.keyId,
        deviceId: intent.deviceId,
        challenge: intent.challenge,
        deviceSignature,
        recoverySignature: bytesToHex(
          signRecoveryMessage(recoverySeed, message),
        ),
      },
      scope.signal,
    );
    assertCurrent();
    const registered = await readRecoveryUpgradeBootstrap(
      context,
      scope.signal,
      assertCurrent,
    );
    if (registered.recoveryPublicKey !== recoveryPublicKey)
      throw new Error('Recovery registration confirmation unavailable');
  } finally {
    scope.dispose();
  }
};
