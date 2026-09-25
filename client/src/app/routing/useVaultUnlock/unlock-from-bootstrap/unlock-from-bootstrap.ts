import { hydrateUnlockedVault } from '#app/routing/useVaultUnlock/hydrate-unlocked-vault';
import { vaultUnlockPolicy } from '#app/routing/useVaultUnlock/vault-unlock-policy';
import { encryptedPersistence } from '#shared/adapters/persistence';
import { unlockCoordinator } from '#shared/adapters/vault-protocol/unlock-coordinator';
import { vaultRotation } from '#shared/adapters/vault-protocol/vault-rotation';
import { passkeyUnlockHandoff } from '#shared/adapters/webauthn/passkey-unlock-handoff';
import { vaultPasskeyCeremony } from '#shared/adapters/webauthn/vault-passkey-ceremony';
import type { AvailableVaultBootstrapMetadata } from '#shared/api/vault-protocol/get-vault-bootstrap/types';
import { issueServerShare } from '#shared/api/vault-protocol/issue-server-share';

type FlowGuard = () => void;

export const unlockFromBootstrap = async (
  accountId: string,
  workspaceId: string,
  bootstrap: AvailableVaultBootstrapMetadata,
  assertCurrent: FlowGuard,
): Promise<void> => {
  const context = {
    accountId,
    workspaceId,
    vaultId: bootstrap.vaultId,
    keyId: bootstrap.keyId,
    deviceId: bootstrap.deviceId,
  };
  const isHighSecurity = vaultUnlockPolicy.isHighSecurityBootstrap(bootstrap);
  const localShare = isHighSecurity
    ? undefined
    : await encryptedPersistence.readVaultLocalShare(context);
  assertCurrent();
  let serverShare: Uint8Array<ArrayBuffer> | undefined;
  try {
    serverShare = await issueServerShare(bootstrap.deviceId);
    assertCurrent();
    let prfKey: CryptoKey | undefined;
    let credentialId: string | undefined;
    const handoff =
      bootstrap.passkeyEnvelope === undefined
        ? undefined
        : passkeyUnlockHandoff.consume({ ...context });
    if (handoff !== undefined) {
      prfKey = handoff.prfKey;
      credentialId = handoff.credentialId;
      if (isHighSecurity && prfKey === undefined) {
        serverShare.fill(0);
        throw new Error('Passkey PRF is required');
      }
    } else if (
      bootstrap.passkeyEnvelope !== undefined &&
      (isHighSecurity || bootstrap.deviceEnvelope === undefined)
    ) {
      try {
        const passkeyResult = await vaultPasskeyCeremony.run(context);
        assertCurrent();
        prfKey = passkeyResult.prfKey;
        credentialId = passkeyResult.credentialId;
      } catch (error) {
        if (!vaultUnlockPolicy.canFallbackToDeviceEnvelope(bootstrap)) {
          serverShare.fill(0);
          throw error;
        }
      }
    }
    if (
      prfKey === undefined &&
      (localShare === undefined || bootstrap.deviceEnvelope === undefined)
    ) {
      serverShare.fill(0);
      throw new Error('Recovery is required');
    }
    const envelopeValue =
      prfKey === undefined
        ? bootstrap.deviceEnvelope
        : bootstrap.passkeyEnvelope;
    if (envelopeValue === undefined) {
      serverShare.fill(0);
      throw new Error('Vault envelope is unavailable');
    }
    let unlocked:
      | Awaited<ReturnType<typeof unlockCoordinator.unlock>>
      | undefined;
    try {
      unlocked = await unlockCoordinator.unlock({
        mode: isHighSecurity ? 'high-security' : 'standard',
        ...(localShare === undefined ? {} : { localShare }),
        serverShare,
        envelope: JSON.parse(envelopeValue),
        context:
          credentialId === undefined ? context : { ...context, credentialId },
        ...(prfKey === undefined ? {} : { prfKey }),
      });
      assertCurrent();
      await encryptedPersistence.unlockWithVaultKeys(
        {
          ...unlocked,
          ...(localShare === undefined ? {} : { localShare }),
        },
        context,
        hydrateUnlockedVault,
      );
      assertCurrent();
    } finally {
      unlocked?.vmk.fill(0);
    }
    try {
      await vaultRotation.resumePending();
      assertCurrent();
    } catch {
      // The encrypted journal remains retryable when fresh-auth commit is unavailable.
    }
  } finally {
    serverShare?.fill(0);
  }
};
