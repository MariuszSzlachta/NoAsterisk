import { mapCreatedSnapshot } from '#features/user-settings/api/synchronize-vault/map-created-snapshot';
import type { SignedSyncFixture } from '#features/user-settings/api/synchronize-vault/testing/build-signed-sync-fixture/types';
import { deviceSigningKey } from '#shared/adapters/vault-protocol/device-signing-key';
import { opaqueSyncSnapshot } from '#shared/adapters/vault-protocol/opaque-sync-snapshot';
import { buildRecoveryRegistrationIntent } from '#shared/adapters/vault-protocol/recovery-registration/testing/build-intent';
import { vaultProtocol } from '#shared/adapters/vault-protocol/vault-protocol';

export const buildSignedSyncFixture = async (): Promise<SignedSyncFixture> => {
  const intent = buildRecoveryRegistrationIntent();
  const context = {
    accountId: intent.accountId,
    workspaceId: intent.workspaceId,
    vaultId: intent.vaultId,
    keyId: intent.keyId,
    deviceId: intent.deviceId,
  };
  const vmk = vaultProtocol.generateVmk();
  try {
    const keys = await vaultProtocol.deriveKeys(vmk, context);
    const pair = await deviceSigningKey.generate();
    const material = {
      context,
      syncKey: keys.sync,
      signingKey: pair.privateKey,
      verifyKey: pair.publicKey,
    };
    const created = await opaqueSyncSnapshot.create({
      plaintext: '{}',
      context,
      revision: 1,
      previousEnvelopeHash: '',
      signingKey: pair.privateKey,
      syncKey: keys.sync,
    });
    return {
      vmk,
      material,
      created,
      snapshot: await mapCreatedSnapshot(material, created),
    };
  } catch (error) {
    vmk.fill(0);
    throw error;
  }
};
