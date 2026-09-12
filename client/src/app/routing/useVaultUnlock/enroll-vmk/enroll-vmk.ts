import { confirmInitializedEnrollment } from '#app/routing/useVaultUnlock/enroll-vmk/confirm-initialized-enrollment';
import type {
  EnrollmentAuthorization,
  EnrollmentBootstrap,
} from '#app/routing/useVaultUnlock/enroll-vmk/types';
import { prepareEnrollmentRestore } from '#app/routing/useVaultUnlock/prepare-enrollment-restore';
import { encryptedPersistence } from '#shared/adapters/persistence';
import { deviceSigningKey } from '#shared/adapters/vault-protocol/device-signing-key';
import {
  encodeEnrollmentDelegation,
  encodeEnrollmentFinalize,
  type EnrollmentTranscriptSnapshot,
} from '#shared/adapters/vault-protocol/enrollment-transcript';
import { hashEnrollmentMessage } from '#shared/adapters/vault-protocol/enrollment-transcript/hash-message';
import { signEnrollmentDeviceMessage } from '#shared/adapters/vault-protocol/enrollment-transcript/sign-device-message';
import {
  deriveRecoveryPublicKey,
  signRecoveryMessage,
} from '#shared/adapters/vault-protocol/recovery-authority';
import { vaultProtocol } from '#shared/adapters/vault-protocol/vault-protocol';
import { vaultProtocolConstants } from '#shared/adapters/vault-protocol/vault-protocol-constants';
import { vaultProtocolUtils } from '#shared/adapters/vault-protocol/vault-protocol-utils';
import { persistVaultDeviceId } from '#shared/api/vault-protocol/persist-device-id';
import { vaultEnrollment } from '#shared/api/vault-protocol/vault-enrollment';
import { bytesToHex } from '#shared/lib/bytes-to-hex';

export const enrollVmk = async (
  accountId: string,
  workspaceId: string,
  bootstrap: EnrollmentBootstrap,
  vmk: Uint8Array,
  assertCurrent: () => void,
  authorization: EnrollmentAuthorization,
): Promise<void> => {
  assertCurrent();
  if ((authorization.purpose === 'initial') !== (bootstrap.status === 'empty'))
    throw new Error('Invalid enrollment purpose');
  const vaultId =
    bootstrap.vaultId ??
    (authorization.purpose === 'initial' ? crypto.randomUUID() : undefined);
  const keyId =
    bootstrap.keyId ??
    (authorization.purpose === 'initial' ? crypto.randomUUID() : undefined);
  if (vaultId === undefined || keyId === undefined)
    throw new Error('Enrollment authority unavailable');
  const context = {
    accountId,
    workspaceId,
    vaultId,
    keyId,
    deviceId:
      authorization.purpose === 'trusted'
        ? authorization.pending.request.intent.deviceId
        : authorization.purpose === 'recovery' &&
            bootstrap.status === 'available'
          ? crypto.randomUUID()
          : bootstrap.deviceId,
  };
  const restore =
    authorization.purpose === 'initial'
      ? undefined
      : await prepareEnrollmentRestore(context, vmk, assertCurrent);
  assertCurrent();
  const signingKeyPair =
    authorization.purpose === 'trusted'
      ? authorization.pending.signingKeyPair
      : await deviceSigningKey.generate();
  assertCurrent();
  const signingPublicKey = JSON.stringify(
    await deviceSigningKey.exportPublicJwk(signingKeyPair.publicKey),
  );
  assertCurrent();
  const prepared =
    authorization.purpose === 'trusted'
      ? authorization.pending.prepared
      : await vaultEnrollment.prepare({
          purpose: authorization.purpose,
          vaultId,
          keyId,
          deviceId: context.deviceId,
          signingPublicKey,
          recoveryPublicKey: bytesToHex(
            deriveRecoveryPublicKey(authorization.recoverySeed),
          ),
        });
  assertCurrent();
  if (
    prepared.intent.accountId !== accountId ||
    prepared.intent.workspaceId !== workspaceId ||
    prepared.intent.vaultId !== vaultId ||
    prepared.intent.keyId !== keyId ||
    prepared.intent.deviceId !== context.deviceId ||
    prepared.intent.signingPublicKey !== signingPublicKey ||
    prepared.intent.purpose !== authorization.purpose
  )
    throw new Error('Enrollment preparation context mismatch');
  const serverShare = vaultProtocolUtils.fromBase64(
    prepared.serverShare,
    vaultProtocolConstants.maxShareLength,
  );
  if (serverShare.length !== vaultProtocolConstants.maxShareLength) {
    serverShare.fill(0);
    throw new Error('Invalid enrollment share');
  }
  try {
    const localShare = await vaultProtocol.generateLocalShare();
    assertCurrent();
    const wrappingKey = await vaultProtocol.deriveDeviceKey(
      localShare,
      serverShare,
      context,
    );
    assertCurrent();
    const envelope = await vaultProtocol.wrapVmk(
      vmk,
      wrappingKey,
      context,
      vaultProtocolConstants.deviceWrapPurpose,
    );
    assertCurrent();
    const deviceEnvelope = JSON.stringify(envelope);
    const intent = prepared.intent;
    const transcript: EnrollmentTranscriptSnapshot =
      intent.purpose === 'trusted'
        ? {
            ...intent,
            deviceEnvelope,
            delegationDigest: await hashEnrollmentMessage(
              encodeEnrollmentDelegation(intent),
            ),
          }
        : { ...intent, deviceEnvelope };
    assertCurrent();
    const message = encodeEnrollmentFinalize(transcript);
    const deviceSignature = await signEnrollmentDeviceMessage(
      signingKeyPair.privateKey,
      message,
    );
    assertCurrent();
    const base = {
      vaultId,
      keyId,
      deviceId: context.deviceId,
      challenge: intent.challenge,
      deviceEnvelope,
      deviceSignature,
    };
    if (
      authorization.purpose === 'trusted' &&
      transcript.purpose === 'trusted'
    ) {
      await vaultEnrollment.finalize({
        ...base,
        purpose: 'trusted',
        delegationDigest: transcript.delegationDigest,
        delegationSignature: authorization.response.delegationSignature,
      });
    } else if (
      authorization.purpose !== 'trusted' &&
      transcript.purpose !== 'trusted'
    ) {
      await vaultEnrollment.finalize({
        ...base,
        purpose: authorization.purpose,
        recoverySignature: bytesToHex(
          signRecoveryMessage(authorization.recoverySeed, message),
        ),
      });
    } else {
      throw new Error('Enrollment proof purpose mismatch');
    }
    assertCurrent();
    const digest = await hashEnrollmentMessage(message);
    assertCurrent();
    const vaultKeys = await vaultProtocol.deriveKeys(vmk, context);
    assertCurrent();
    try {
      await encryptedPersistence.unlockWithVaultKeys(
        {
          ...vaultKeys,
          localShare,
          signingKeyPair,
          vmk,
          requiresRemoteRestore: restore !== undefined,
        },
        context,
        async (isActive) => {
          await confirmInitializedEnrollment(
            transcript,
            digest,
            signingKeyPair.privateKey,
            assertCurrent,
            isActive,
            restore,
          );
          assertCurrent();
          if (!isActive())
            throw new Error('Enrollment initialization invalidated');
          if (context.deviceId !== bootstrap.deviceId)
            persistVaultDeviceId(context.deviceId);
        },
      );
    } catch (error) {
      encryptedPersistence.lock();
      throw error;
    }
  } finally {
    serverShare.fill(0);
  }
};
