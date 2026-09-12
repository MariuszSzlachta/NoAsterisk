import { createHash, sign } from 'node:crypto';
import { ed25519 } from '@noble/curves/ed25519.js';
import { EnrollmentTranscript } from '@vault-protocol/domain/value-objects/enrollment-transcript';
import type {
  SignedEnrollment,
  SignedEnrollmentFinalization,
} from '@vault-protocol/domain/entities/signed-enrollment';
import type { VaultSignatureFixture } from '@vault-protocol/testing/build-vault-signature-fixture/types';

export const signSignedEnrollment = (
  enrollment: SignedEnrollment,
  device: VaultSignatureFixture,
  approver?: VaultSignatureFixture,
): SignedEnrollmentFinalization => {
  const intent = enrollment.snapshot.intent;
  const deviceEnvelope = '{"ciphertext":"synthetic-encrypted-device-envelope"}';
  const delegation =
    intent.purpose === 'trusted'
      ? new EnrollmentTranscript(intent).toDelegationSigningBytes()
      : undefined;
  const transcript = new EnrollmentTranscript(
    intent.purpose === 'trusted' && delegation !== undefined
      ? {
          ...intent,
          deviceEnvelope,
          delegationDigest: createHash('sha256')
            .update(delegation)
            .digest('hex'),
        }
      : { ...intent, deviceEnvelope },
  );
  const bytes = transcript.toFinalizeSigningBytes();
  const common = {
    accountId: intent.accountId,
    workspaceId: intent.workspaceId,
    vaultId: intent.vaultId,
    keyId: intent.keyId,
    deviceId: intent.deviceId,
    challenge: intent.challenge,
    deviceEnvelope,
    authDeadline: Date.now() + 300_000,
    deviceSignature: sign('sha256', bytes, {
      key: device.devicePrivateKey,
      dsaEncoding: 'ieee-p1363',
    }).toString('hex'),
  };
  if (transcript.snapshot.purpose !== 'trusted')
    return {
      ...common,
      purpose: transcript.snapshot.purpose,
      recoverySignature: Buffer.from(
        ed25519.sign(bytes, device.recoverySeed),
      ).toString('hex'),
    };
  if (delegation === undefined || approver === undefined)
    throw new Error('Test delegation signer unavailable');
  return {
    ...common,
    purpose: 'trusted',
    delegationDigest: transcript.snapshot.delegationDigest,
    delegationSignature: sign('sha256', delegation, {
      key: approver.devicePrivateKey,
      dsaEncoding: 'ieee-p1363',
    }).toString('hex'),
  };
};
