import { encryptedPersistence } from '#shared/adapters/persistence';
import { assertVaultSessionCurrent } from '#shared/adapters/persistence/session/assert-vault-session-current';
import { recoveryCode as recoveryCodeProtocol } from '#shared/adapters/vault-protocol/recovery-code';
import { vaultProtocol } from '#shared/adapters/vault-protocol/vault-protocol';
import { vaultProtocolConstants } from '#shared/adapters/vault-protocol/vault-protocol-constants';
import { vaultPasskeyCeremony } from '#shared/adapters/webauthn/vault-passkey-ceremony';
import { issueServerShare } from '#shared/api/vault-protocol/issue-server-share';
import { rotateVault } from '#shared/api/vault-protocol/rotate-vault';
import { vaultBootstrap } from '#shared/api/vault-protocol/vault-bootstrap';

interface RotateVaultInput {
  readonly recoveryCode: string;
  readonly confirmRecoveryCode: (code: string) => Promise<boolean>;
}

const rotate = async ({
  recoveryCode: code,
  confirmRecoveryCode,
}: RotateVaultInput): Promise<{ readonly recoveryCode: string }> => {
  const material = encryptedPersistence.requireVaultSyncMaterial();
  const generation = encryptedPersistence.getGeneration();
  const bootstrap = await vaultBootstrap.get();
  if (
    bootstrap.status !== 'available' ||
    bootstrap.vaultId === undefined ||
    bootstrap.keyId === undefined ||
    bootstrap.recoveryPublicKey !== undefined
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
  let nextVmk: Uint8Array | undefined;
  let serverShare: Uint8Array | undefined;
  try {
    await encryptedPersistence.verifyVaultVmk(currentVmk, context);
    nextVmk = vaultProtocol.generateVmk();
    const nextRecoveryCode = await recoveryCodeProtocol.encode(nextVmk);
    if (!(await confirmRecoveryCode(nextRecoveryCode)))
      throw new Error('Recovery backup was not confirmed');
    assertVaultSessionCurrent(
      encryptedPersistence,
      generation,
      material.context,
    );
    serverShare = await issueServerShare(context.deviceId);
    const nextContext = { ...context, keyId: crypto.randomUUID() };
    const idempotencyKey = crypto.randomUUID();
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
    assertVaultSessionCurrent(
      encryptedPersistence,
      generation,
      material.context,
    );
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
        recoveryBackupConfirmed: true,
      },
    );
    assertVaultSessionCurrent(encryptedPersistence, generation, nextContext);
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
    assertVaultSessionCurrent(encryptedPersistence, generation, nextContext);
    await encryptedPersistence.clearPendingVaultRotation(idempotencyKey);
    return { recoveryCode: nextRecoveryCode };
  } finally {
    currentVmk.fill(0);
    nextVmk?.fill(0);
    serverShare?.fill(0);
  }
};

const rotateWithPasskey = async (
  code: string,
  confirmRecoveryCode: (code: string) => Promise<boolean>,
): Promise<{ readonly recoveryCode: string }> => {
  const material = encryptedPersistence.requireVaultSyncMaterial();
  const generation = encryptedPersistence.getGeneration();
  const bootstrap = await vaultBootstrap.get();
  if (
    bootstrap.status !== 'available' ||
    bootstrap.vaultId === undefined ||
    bootstrap.keyId === undefined ||
    bootstrap.recoveryPublicKey !== undefined
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
  let serverShare: Uint8Array | undefined;
  let nextVmk: Uint8Array | undefined;
  try {
    await encryptedPersistence.verifyVaultVmk(currentVmk, context);
    nextVmk = vaultProtocol.generateVmk();
    const nextRecoveryCode = await recoveryCodeProtocol.encode(nextVmk);
    if (!(await confirmRecoveryCode(nextRecoveryCode)))
      throw new Error('Recovery backup was not confirmed');
    assertVaultSessionCurrent(
      encryptedPersistence,
      generation,
      material.context,
    );
    serverShare = await issueServerShare(context.deviceId);
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
    assertVaultSessionCurrent(
      encryptedPersistence,
      generation,
      material.context,
    );
    await encryptedPersistence.rotateVaultKeys(
      { ...nextKeys, localShare: null },
      nextContext,
      {
        idempotencyKey,
        envelopePurpose: vaultProtocolConstants.passkeyWrapPurpose,
        envelope: JSON.stringify(nextEnvelope),
        nextVmk,
        recoveryBackupConfirmed: true,
      },
    );
    assertVaultSessionCurrent(encryptedPersistence, generation, nextContext);
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
    assertVaultSessionCurrent(encryptedPersistence, generation, nextContext);
    await encryptedPersistence.clearPendingVaultRotation(idempotencyKey);
    return { recoveryCode: nextRecoveryCode };
  } finally {
    currentVmk.fill(0);
    nextVmk?.fill(0);
    serverShare?.fill(0);
  }
};

const resumePending = async (
  confirmRecoveryCode?: (code: string) => Promise<boolean>,
): Promise<boolean> => {
  const material = encryptedPersistence.requireVaultSyncMaterial();
  const generation = encryptedPersistence.getGeneration();
  const pending = await encryptedPersistence.getPendingVaultRotation();
  assertVaultSessionCurrent(encryptedPersistence, generation, material.context);
  if (pending === undefined) return false;
  const bootstrap = await vaultBootstrap.get();
  assertVaultSessionCurrent(encryptedPersistence, generation, material.context);
  if (bootstrap.status !== 'empty' && bootstrap.recoveryPublicKey !== undefined)
    throw new Error(
      'Pending vault rotation requires recovery authority support',
    );
  if (material.context.keyId !== pending.nextKeyId)
    throw new Error('Pending rotation key does not match the active vault');
  if (pending.recoveryBackupConfirmed !== true) {
    if (confirmRecoveryCode === undefined)
      throw new Error('Pending rotation has no confirmed recovery backup');
    const transfer = encryptedPersistence.getVaultTransferMaterial(
      material.context,
    );
    try {
      const code = await recoveryCodeProtocol.encode(transfer.vmk);
      if (!(await confirmRecoveryCode(code)))
        throw new Error('Recovery backup was not confirmed');
      assertVaultSessionCurrent(
        encryptedPersistence,
        generation,
        material.context,
      );
      await encryptedPersistence.confirmPendingVaultRotationBackup(
        pending.idempotencyKey,
      );
    } finally {
      transfer.vmk.fill(0);
    }
  }
  assertVaultSessionCurrent(encryptedPersistence, generation, material.context);
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
  assertVaultSessionCurrent(encryptedPersistence, generation, material.context);
  await encryptedPersistence.clearPendingVaultRotation(pending.idempotencyKey);
  return true;
};

export const vaultRotation = Object.freeze({
  rotate,
  rotateWithPasskey,
  resumePending,
});
