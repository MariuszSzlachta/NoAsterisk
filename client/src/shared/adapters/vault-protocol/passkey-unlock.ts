import { encryptedPersistence } from '#shared/adapters/persistence';
import { recoveryCode } from '#shared/adapters/vault-protocol/recovery-code';
import { vaultProtocol } from '#shared/adapters/vault-protocol/vault-protocol';
import { vaultProtocolConstants } from '#shared/adapters/vault-protocol/vault-protocol-constants';
import { vaultPasskeyCeremony } from '#shared/adapters/webauthn/vault-passkey-ceremony';
import { issueServerShare } from '#shared/api/vault-protocol/issue-server-share';
import { passkeyUnlockApi } from '#shared/api/vault-protocol/passkey-unlock';
import { vaultBootstrap } from '#shared/api/vault-protocol/vault-bootstrap';

const enable = async (code: string): Promise<void> => {
  const material = encryptedPersistence.requireVaultSyncMaterial();
  const bootstrap = await vaultBootstrap.get();
  if (
    bootstrap.status !== 'available' ||
    bootstrap.vaultId === undefined ||
    bootstrap.keyId === undefined ||
    bootstrap.deviceEnvelope === undefined
  )
    throw new Error('Vault device envelope is unavailable');
  const context = {
    ...material.context,
    vaultId: bootstrap.vaultId,
    keyId: bootstrap.keyId,
  };
  const localShare = await encryptedPersistence.readVaultLocalShare(context);
  if (localShare === undefined) throw new Error('LocalShare is unavailable');
  const vmk = await recoveryCode.restore(code);
  const serverShare = await issueServerShare(context.deviceId);
  try {
    await encryptedPersistence.verifyVaultVmk(vmk, context);
    const passkey = await vaultPasskeyCeremony.run(context);
    const wrappingKey = await vaultProtocol.derivePrfKey(
      passkey.prfKey,
      serverShare,
      { ...context, credentialId: passkey.credentialId },
    );
    const envelope = await vaultProtocol.wrapVmk(
      vmk,
      wrappingKey,
      { ...context, credentialId: passkey.credentialId },
      vaultProtocolConstants.passkeyWrapPurpose,
    );
    await passkeyUnlockApi.enable({
      vaultId: context.vaultId,
      keyId: context.keyId,
      deviceId: context.deviceId,
      passkeyEnvelope: JSON.stringify(envelope),
    });
  } finally {
    vmk.fill(0);
    serverShare.fill(0);
  }
};

export const passkeyUnlock = Object.freeze({ enable });
