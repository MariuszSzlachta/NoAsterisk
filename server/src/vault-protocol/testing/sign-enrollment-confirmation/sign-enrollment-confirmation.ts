import { createHash, sign } from 'node:crypto';
import type {
  SignedEnrollment,
  SignedEnrollmentFinalization,
  SignedEnrollmentConfirmation,
} from '@vault-protocol/domain/entities/signed-enrollment';
import type { VaultSignatureFixture } from '@vault-protocol/testing/build-vault-signature-fixture/types';
export const signEnrollmentConfirmation = (
  enrollment: SignedEnrollment,
  finalized: SignedEnrollmentFinalization,
  device: VaultSignatureFixture,
): SignedEnrollmentConfirmation => {
  const digest = createHash('sha256')
    .update(enrollment.finalizeTranscript(finalized).toFinalizeSigningBytes())
    .digest('hex');
  const pending = enrollment.consume(digest);
  const intent = enrollment.snapshot.intent;
  return {
    accountId: intent.accountId,
    workspaceId: intent.workspaceId,
    vaultId: intent.vaultId,
    keyId: intent.keyId,
    deviceId: intent.deviceId,
    challenge: intent.challenge,
    digest,
    authDeadline: finalized.authDeadline,
    signature: sign('sha256', pending.confirmationBytes(digest), {
      key: device.devicePrivateKey,
      dsaEncoding: 'ieee-p1363',
    }).toString('hex'),
  };
};
