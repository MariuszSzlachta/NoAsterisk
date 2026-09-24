import { encryptedPersistence } from '#shared/adapters/persistence';
import { assertVaultSessionCurrent } from '#shared/adapters/persistence/session/assert-vault-session-current';
import { deviceSigningKey } from '#shared/adapters/vault-protocol/device-signing-key';
import { resumeDualRootRotation } from '#shared/adapters/vault-protocol/dual-root-vault-rotation/resumeDualRootRotation';
import type {
  DualRootRotationInput,
  DualRootRotationResult,
} from '#shared/adapters/vault-protocol/dual-root-vault-rotation/types';
import { deriveRecoveryPublicKey } from '#shared/adapters/vault-protocol/recovery-authority';
import { decodeRecoveryBackup } from '#shared/adapters/vault-protocol/recovery-backup/decode';
import { encodeRecoveryBackup } from '#shared/adapters/vault-protocol/recovery-backup/encode';
import { signRotationTranscript } from '#shared/adapters/vault-protocol/rotation-transcript/sign';
import { vaultProtocol } from '#shared/adapters/vault-protocol/vault-protocol';
import { vaultProtocolConstants } from '#shared/adapters/vault-protocol/vault-protocol-constants';
import { vaultPasskeyCeremony } from '#shared/adapters/webauthn/vault-passkey-ceremony';
import {
  finalizeDualRootRotation,
  prepareDualRootRotation,
} from '#shared/api/vault-protocol/dual-root-rotation';
import { issueServerShare } from '#shared/api/vault-protocol/issue-server-share';
import { vaultBootstrap } from '#shared/api/vault-protocol/vault-bootstrap';
import { bytesToHex } from '#shared/lib/bytes-to-hex';

export const rotateWithRecoveryAuthority = async ({
  recoveryBackup,
  confirmRecoveryBackup,
}: DualRootRotationInput): Promise<DualRootRotationResult> => {
  const material = encryptedPersistence.requireVaultSyncMaterial();
  const generation = encryptedPersistence.getGeneration();
  const bootstrap = await vaultBootstrap.get();
  const assertCurrent = (): void =>
    assertVaultSessionCurrent(
      encryptedPersistence,
      generation,
      material.context,
    );
  assertCurrent();
  if (
    bootstrap.status !== 'available' ||
    bootstrap.vaultId === undefined ||
    bootstrap.keyId === undefined ||
    bootstrap.recoveryPublicKey === undefined
  )
    throw new Error('Dual-root vault rotation is unavailable');
  const context = {
    ...material.context,
    vaultId: bootstrap.vaultId,
    keyId: bootstrap.keyId,
  };
  const pending = await encryptedPersistence.getPendingVaultRotation();
  assertCurrent();
  if (pending !== undefined)
    return resumeDualRootRotation({
      material,
      generation,
      bootstrap,
      pending,
      recoveryBackup,
    });
  if (
    bootstrap.vaultId !== material.context.vaultId ||
    bootstrap.keyId !== material.context.keyId ||
    bootstrap.deviceId !== material.context.deviceId
  )
    throw new Error('Dual-root rotation context mismatch');
  const current = await decodeRecoveryBackup(recoveryBackup);
  let nextVmk: Uint8Array | undefined;
  let nextRecoverySeed: Uint8Array | undefined;
  let serverShare: Uint8Array | undefined;
  try {
    await encryptedPersistence.verifyVaultVmk(current.vmk, context);
    assertCurrent();
    const generatedVmk = Uint8Array.from(vaultProtocol.generateVmk());
    const generatedRecoverySeed = Uint8Array.from(vaultProtocol.generateVmk());
    nextVmk = generatedVmk;
    nextRecoverySeed = generatedRecoverySeed;
    const nextRecoveryBackup = await encodeRecoveryBackup({
      vmk: generatedVmk,
      recoverySeed: generatedRecoverySeed,
    });
    assertCurrent();
    if (!(await confirmRecoveryBackup(nextRecoveryBackup)))
      throw new Error('Recovery backup was not confirmed');
    assertCurrent();
    assertVaultSessionCurrent(
      encryptedPersistence,
      generation,
      material.context,
    );
    serverShare = await issueServerShare(context.deviceId);
    assertCurrent();
    const nextContext = { ...context, keyId: crypto.randomUUID() };
    const nextKeys = await vaultProtocol.deriveKeys(generatedVmk, nextContext);
    assertCurrent();
    const usePasskey = bootstrap.securityProfile === 'high-security';
    let localShare: CryptoKey | undefined;
    let envelopePurpose: 'device-wrap' | 'passkey-wrap' = 'device-wrap';
    let envelope: string;
    if (usePasskey) {
      const passkey = await vaultPasskeyCeremony.run(context);
      assertCurrent();
      const wrappingKey = await vaultProtocol.derivePrfKey(
        passkey.prfKey,
        serverShare,
        {
          ...nextContext,
          deviceId: context.deviceId,
          credentialId: passkey.credentialId,
        },
      );
      assertCurrent();
      envelope = JSON.stringify(
        await vaultProtocol.wrapVmk(
          generatedVmk,
          wrappingKey,
          {
            ...nextContext,
            deviceId: context.deviceId,
            credentialId: passkey.credentialId,
          },
          vaultProtocolConstants.passkeyWrapPurpose,
        ),
      );
      assertCurrent();
      envelopePurpose = 'passkey-wrap';
    } else {
      localShare = await encryptedPersistence.readVaultLocalShare(context);
      assertCurrent();
      if (localShare === undefined)
        throw new Error('LocalShare is unavailable');
      const wrappingKey = await vaultProtocol.deriveDeviceKey(
        localShare,
        serverShare,
        nextContext,
      );
      assertCurrent();
      envelope = JSON.stringify(
        await vaultProtocol.wrapVmk(
          generatedVmk,
          wrappingKey,
          { ...nextContext, deviceId: context.deviceId },
          vaultProtocolConstants.deviceWrapPurpose,
        ),
      );
      assertCurrent();
    }
    const signingPublicKey = JSON.stringify(
      await deviceSigningKey.exportPublicJwk(material.verifyKey),
    );
    assertCurrent();
    const transcript = await prepareDualRootRotation({
      accountId: context.accountId,
      workspaceId: context.workspaceId,
      vaultId: context.vaultId,
      deviceId: context.deviceId,
      currentKeyId: context.keyId,
      nextKeyId: nextContext.keyId,
      nextRecoveryPublicKey: bytesToHex(
        deriveRecoveryPublicKey(generatedRecoverySeed),
      ),
      signingPublicKey,
      envelopePurpose,
      envelope,
    });
    assertCurrent();
    const proof = await signRotationTranscript(
      transcript,
      material.signingKey,
      current.recoverySeed,
    );
    assertCurrent();
    assertVaultSessionCurrent(
      encryptedPersistence,
      generation,
      material.context,
    );
    await encryptedPersistence.rotateVaultKeys(
      { ...nextKeys, localShare: usePasskey ? null : (localShare ?? null) },
      nextContext,
      {
        idempotencyKey: transcript.challenge,
        envelopePurpose,
        envelope,
        transcript,
        nextVmk: generatedVmk,
        recoveryBackupConfirmed: true,
      },
    );
    assertVaultSessionCurrent(encryptedPersistence, generation, nextContext);
    await finalizeDualRootRotation({ transcript, ...proof });
    assertVaultSessionCurrent(encryptedPersistence, generation, nextContext);
    await encryptedPersistence.clearPendingVaultRotation(transcript.challenge);
    return {
      status: 'rotated',
      keyId: nextContext.keyId,
      recoveryBackup: nextRecoveryBackup,
    };
  } finally {
    current.vmk.fill(0);
    current.recoverySeed.fill(0);
    nextVmk?.fill(0);
    nextRecoverySeed?.fill(0);
    serverShare?.fill(0);
  }
};
