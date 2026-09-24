import { encryptedPersistence } from '#shared/adapters/persistence';
import { assertVaultSessionCurrent } from '#shared/adapters/persistence/session/assert-vault-session-current';
import { highSecurity } from '#shared/adapters/vault-protocol/high-security';
import { vaultPasskeyCeremony } from '#shared/adapters/webauthn/vault-passkey-ceremony';
import { issueServerShare } from '#shared/api/vault-protocol/issue-server-share';
import { vaultBootstrap } from '#shared/api/vault-protocol/vault-bootstrap';

const enable = async (recoveryCode: string): Promise<void> => {
  const material = encryptedPersistence.requireVaultSyncMaterial();
  const generation = encryptedPersistence.getGeneration();
  const assertCurrent = (): void =>
    assertVaultSessionCurrent(
      encryptedPersistence,
      generation,
      material.context,
    );
  const bootstrap = await vaultBootstrap.get();
  assertCurrent();
  if (
    bootstrap.status !== 'available' ||
    bootstrap.vaultId === undefined ||
    bootstrap.keyId === undefined ||
    bootstrap.deviceId !== material.context.deviceId ||
    bootstrap.vaultId !== material.context.vaultId ||
    bootstrap.keyId !== material.context.keyId ||
    bootstrap.deviceEnvelope === undefined
  )
    throw new Error('Vault device envelope is unavailable');
  const context = {
    ...material.context,
    vaultId: bootstrap.vaultId,
    keyId: bootstrap.keyId,
  };
  const localShare = await encryptedPersistence.readVaultLocalShare(context);
  assertCurrent();
  if (localShare === undefined) throw new Error('LocalShare is unavailable');
  // Device-wrap has no passkey identity. Selecting a credential from its
  // header would turn an empty/nonexistent credential id into an allow-list
  // entry. High-security enablement therefore performs a discoverable,
  // user-selected PRF ceremony and binds the resulting credential below.
  const passkey = await vaultPasskeyCeremony.run(context);
  assertCurrent();
  const serverShare = await issueServerShare(context.deviceId);
  try {
    assertCurrent();
    await highSecurity.enable({
      context: { ...context, credentialId: passkey.credentialId },
      localShare,
      serverShare,
      deviceEnvelope: JSON.parse(bootstrap.deviceEnvelope),
      prfKey: passkey.prfKey,
      recoveryCode,
      assertCurrent,
    });
  } finally {
    serverShare.fill(0);
  }
};

const disable = async (recoveryCode: string): Promise<void> => {
  const material = encryptedPersistence.requireVaultSyncMaterial();
  const generation = encryptedPersistence.getGeneration();
  const assertCurrent = (): void =>
    assertVaultSessionCurrent(
      encryptedPersistence,
      generation,
      material.context,
    );
  const bootstrap = await vaultBootstrap.get();
  assertCurrent();
  if (
    bootstrap.status !== 'available' ||
    bootstrap.vaultId === undefined ||
    bootstrap.keyId === undefined ||
    bootstrap.deviceId !== material.context.deviceId ||
    bootstrap.vaultId !== material.context.vaultId ||
    bootstrap.keyId !== material.context.keyId ||
    bootstrap.passkeyEnvelope === undefined
  )
    throw new Error('High-security envelope is unavailable');
  const context = {
    ...material.context,
    vaultId: bootstrap.vaultId,
    keyId: bootstrap.keyId,
  };
  assertCurrent();
  const envelopeHeader = JSON.parse(bootstrap.passkeyEnvelope).header;
  const credentialId =
    typeof envelopeHeader?.credentialId === 'string'
      ? envelopeHeader.credentialId
      : undefined;
  const passkey = await vaultPasskeyCeremony.run(context, credentialId);
  assertCurrent();
  const serverShare = await issueServerShare(context.deviceId);
  try {
    assertCurrent();
    await highSecurity.disable({
      context: { ...context, credentialId: passkey.credentialId },
      serverShare,
      passkeyEnvelope: JSON.parse(bootstrap.passkeyEnvelope),
      prfKey: passkey.prfKey,
      recoveryCode,
      assertCurrent,
    });
  } finally {
    serverShare.fill(0);
  }
};

export const currentHighSecurity = Object.freeze({ enable, disable });
