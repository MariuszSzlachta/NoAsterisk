import { encryptedPersistence } from '#shared/adapters/persistence';
import { highSecurity } from '#shared/adapters/vault-protocol/high-security';
import { issueServerShare } from '#shared/api/vault-protocol/issue-server-share';
import { vaultBootstrap } from '#shared/api/vault-protocol/vault-bootstrap';
import { vaultPasskeyCeremony } from '#shared/adapters/webauthn/vault-passkey-ceremony';

const enable = async (recoveryCode: string): Promise<void> => {
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
  const serverShare = await issueServerShare(context.deviceId);
  try {
    const passkey = await vaultPasskeyCeremony.run(context);
    await highSecurity.enable({
      context: { ...context, credentialId: passkey.credentialId },
      localShare,
      serverShare,
      deviceEnvelope: JSON.parse(bootstrap.deviceEnvelope),
      prfKey: passkey.prfKey,
      recoveryCode,
    });
  } finally {
    serverShare.fill(0);
  }
};

const disable = async (recoveryCode: string): Promise<void> => {
  const material = encryptedPersistence.requireVaultSyncMaterial();
  const bootstrap = await vaultBootstrap.get();
  if (
    bootstrap.status !== 'available' ||
    bootstrap.vaultId === undefined ||
    bootstrap.keyId === undefined ||
    bootstrap.passkeyEnvelope === undefined
  )
    throw new Error('High-security envelope is unavailable');
  const context = {
    ...material.context,
    vaultId: bootstrap.vaultId,
    keyId: bootstrap.keyId,
  };
  const serverShare = await issueServerShare(context.deviceId);
  try {
    const passkey = await vaultPasskeyCeremony.run(context);
    await highSecurity.disable({
      context: { ...context, credentialId: passkey.credentialId },
      serverShare,
      passkeyEnvelope: JSON.parse(bootstrap.passkeyEnvelope),
      prfKey: passkey.prfKey,
      recoveryCode,
    });
  } finally {
    serverShare.fill(0);
  }
};

export const currentHighSecurity = Object.freeze({ enable, disable });
