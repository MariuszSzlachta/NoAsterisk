import { encryptedPersistence } from '#shared/adapters/persistence';
import { recoveryCode as recoveryCodeProtocol } from '#shared/adapters/vault-protocol/recovery-code';
import { vaultProtocol } from '#shared/adapters/vault-protocol/vault-protocol';
import { vaultProtocolConstants } from '#shared/adapters/vault-protocol/vault-protocol-constants';
import { vaultPasskeyCeremony } from '#shared/adapters/webauthn/vault-passkey-ceremony';
import { issueServerShare } from '#shared/api/vault-protocol/issue-server-share';
import { rotateVault } from '#shared/api/vault-protocol/rotate-vault';
import { vaultBootstrap } from '#shared/api/vault-protocol/vault-bootstrap';

interface RotateVaultInput {
  readonly recoveryCode: string;
}

const rotate = async ({
  recoveryCode: code,
}: RotateVaultInput): Promise<void> => {
  const material = encryptedPersistence.requireVaultSyncMaterial();
  const bootstrap = await vaultBootstrap.get();
  if (
    bootstrap.status !== 'available' ||
    bootstrap.vaultId === undefined ||
    bootstrap.keyId === undefined
  )
    throw new Error('Vault rotation requires an enrolled device');
  const context = {
    ...material.context,
    vaultId: bootstrap.vaultId,
    keyId: bootstrap.keyId,
  };
  const pending = await encryptedPersistence.getPendingVaultRotation();
  if (
    pending !== undefined &&
    material.context.keyId === pending.nextKeyId &&
    bootstrap.keyId === pending.currentKeyId
  )
    throw new Error('Pending vault rotation must be resumed first');
  const localShare = await encryptedPersistence.readVaultLocalShare(context);
  if (localShare === undefined)
    throw new Error('Vault rotation requires LocalShare');
  const currentVmk = await recoveryCodeProtocol.restore(code);
  await encryptedPersistence.verifyVaultVmk(currentVmk, context);
  const nextVmk = vaultProtocol.generateVmk();
  const serverShare = await issueServerShare(context.deviceId);
  const nextContext = { ...context, keyId: crypto.randomUUID() };
  const idempotencyKey = crypto.randomUUID();
  try {
    const nextKeys = await vaultProtocol.deriveKeys(nextVmk, nextContext);
    const nextWrappingKey = await vaultProtocol.deriveDeviceKey(
      localShare,
      serverShare,
      nextContext,
    );
    const nextEnvelope = await vaultProtocol.wrapVmk(
      nextVmk,
      nextWrappingKey,
      { ...nextContext, deviceId: context.deviceId },
      vaultProtocolConstants.deviceWrapPurpose,
    );
    let nextPasskeyEnvelope: string | undefined;
    if (
      bootstrap.securityProfile !== 'high-security' &&
      bootstrap.passkeyEnvelope !== undefined
    ) {
      try {
        const passkey = await vaultPasskeyCeremony.run(context);
        const passkeyWrappingKey = await vaultProtocol.derivePrfKey(
          passkey.prfKey,
          serverShare,
          {
            ...nextContext,
            deviceId: context.deviceId,
            credentialId: passkey.credentialId,
          },
        );
        const passkeyEnvelope = await vaultProtocol.wrapVmk(
          nextVmk,
          passkeyWrappingKey,
          {
            ...nextContext,
            deviceId: context.deviceId,
            credentialId: passkey.credentialId,
          },
          vaultProtocolConstants.passkeyWrapPurpose,
        );
        nextPasskeyEnvelope = JSON.stringify(passkeyEnvelope);
      } catch {
        // Standard rotation remains available through split unlock when PRF
        // is unavailable or the optional ceremony is cancelled.
      }
    }
    await encryptedPersistence.rotateVaultKeys(
      { ...nextKeys, localShare },
      nextContext,
      {
        idempotencyKey,
        envelopePurpose: vaultProtocolConstants.deviceWrapPurpose,
        envelope: JSON.stringify(nextEnvelope),
        ...(nextPasskeyEnvelope === undefined
          ? {}
          : { passkeyEnvelope: nextPasskeyEnvelope }),
        nextVmk,
      },
    );
    const result = await rotateVault.rotate({
      vaultId: context.vaultId,
      deviceId: context.deviceId,
      currentKeyId: context.keyId,
      nextKeyId: nextContext.keyId,
      envelopePurpose: vaultProtocolConstants.deviceWrapPurpose,
      envelope: JSON.stringify(nextEnvelope),
      ...(nextPasskeyEnvelope === undefined
        ? {}
        : { passkeyEnvelope: nextPasskeyEnvelope }),
      idempotencyKey,
    });
    if (result.keyId !== nextContext.keyId)
      throw new Error('Vault rotation key confirmation mismatch');
    await encryptedPersistence.clearPendingVaultRotation(idempotencyKey);
  } finally {
    currentVmk.fill(0);
    nextVmk.fill(0);
    serverShare.fill(0);
  }
};

const rotateWithPasskey = async (code: string): Promise<void> => {
  const material = encryptedPersistence.requireVaultSyncMaterial();
  const bootstrap = await vaultBootstrap.get();
  if (
    bootstrap.status !== 'available' ||
    bootstrap.vaultId === undefined ||
    bootstrap.keyId === undefined
  )
    throw new Error('Vault rotation requires an enrolled device');
  const context = {
    ...material.context,
    vaultId: bootstrap.vaultId,
    keyId: bootstrap.keyId,
  };
  const pending = await encryptedPersistence.getPendingVaultRotation();
  if (
    pending !== undefined &&
    material.context.keyId === pending.nextKeyId &&
    bootstrap.keyId === pending.currentKeyId
  )
    throw new Error('Pending vault rotation must be resumed first');
  const currentVmk = await recoveryCodeProtocol.restore(code);
  await encryptedPersistence.verifyVaultVmk(currentVmk, context);
  const serverShare = await issueServerShare(context.deviceId);
  const nextVmk = vaultProtocol.generateVmk();
  try {
    const passkey = await vaultPasskeyCeremony.run(context);
    const nextContext = { ...context, keyId: crypto.randomUUID() };
    const nextKeys = await vaultProtocol.deriveKeys(nextVmk, nextContext);
    const wrappingKey = await vaultProtocol.derivePrfKey(
      passkey.prfKey,
      serverShare,
      {
        ...nextContext,
        deviceId: context.deviceId,
        credentialId: passkey.credentialId,
      },
    );
    const nextEnvelope = await vaultProtocol.wrapVmk(
      nextVmk,
      wrappingKey,
      {
        ...nextContext,
        deviceId: context.deviceId,
        credentialId: passkey.credentialId,
      },
      vaultProtocolConstants.passkeyWrapPurpose,
    );
    const idempotencyKey = crypto.randomUUID();
    await encryptedPersistence.rotateVaultKeys(
      { ...nextKeys, localShare: null },
      nextContext,
      {
        idempotencyKey,
        envelopePurpose: vaultProtocolConstants.passkeyWrapPurpose,
        envelope: JSON.stringify(nextEnvelope),
        nextVmk,
      },
    );
    const result = await rotateVault.rotate({
      vaultId: context.vaultId,
      deviceId: context.deviceId,
      currentKeyId: context.keyId,
      nextKeyId: nextContext.keyId,
      envelopePurpose: vaultProtocolConstants.passkeyWrapPurpose,
      envelope: JSON.stringify(nextEnvelope),
      idempotencyKey,
    });
    if (result.keyId !== nextContext.keyId)
      throw new Error('Vault rotation key confirmation mismatch');
    await encryptedPersistence.clearPendingVaultRotation(idempotencyKey);
  } finally {
    currentVmk.fill(0);
    nextVmk.fill(0);
    serverShare.fill(0);
  }
};

const resumePending = async (): Promise<boolean> => {
  const pending = await encryptedPersistence.getPendingVaultRotation();
  if (pending === undefined) return false;
  const material = encryptedPersistence.requireVaultSyncMaterial();
  const result = await rotateVault.rotate({
    vaultId: material.context.vaultId,
    deviceId: material.context.deviceId,
    currentKeyId: pending.currentKeyId,
    nextKeyId: pending.nextKeyId,
    envelopePurpose: pending.envelopePurpose,
    envelope: pending.envelope,
    ...(pending.passkeyEnvelope === undefined
      ? {}
      : { passkeyEnvelope: pending.passkeyEnvelope }),
    idempotencyKey: pending.idempotencyKey,
  });
  if (result.keyId !== pending.nextKeyId)
    throw new Error('Pending vault rotation confirmation mismatch');
  await encryptedPersistence.clearPendingVaultRotation(pending.idempotencyKey);
  return true;
};

export const vaultRotation = Object.freeze({
  rotate,
  rotateWithPasskey,
  resumePending,
});
