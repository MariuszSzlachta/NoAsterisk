import type { SignedEnrollment } from '@vault-protocol/domain/entities/signed-enrollment';
import type { EnrollmentPreparationView } from '@vault-protocol/application/mappers/map-signed-enrollment-preparation/types';

export const mapSignedEnrollmentToPreparation = (
  enrollment: SignedEnrollment,
): EnrollmentPreparationView => {
  const snapshot = enrollment.snapshot.intent;
  const share = enrollment.copyPreparedShare();
  try {
    return {
      serverShare: Buffer.from(
        share.buffer,
        share.byteOffset,
        share.byteLength,
      ).toString('base64'),
      intent: {
        accountId: snapshot.accountId,
        workspaceId: snapshot.workspaceId,
        vaultId: snapshot.vaultId,
        keyId: snapshot.keyId,
        deviceId: snapshot.deviceId,
        signingPublicKey: snapshot.signingPublicKey,
        challenge: snapshot.challenge,
        createdAt: snapshot.createdAt,
        expiresAt: snapshot.expiresAt,
        deviceEnvelope: '{}',
        ...(snapshot.purpose === 'trusted'
          ? {
              purpose: 'trusted',
              oldDeviceId: snapshot.oldDeviceId,
              newEphemeralPublicKey: snapshot.newEphemeralPublicKey,
              delegationDigest: snapshot.delegationDigest,
            }
          : {
              purpose: snapshot.purpose,
              recoveryPublicKey: snapshot.recoveryPublicKey,
            }),
      },
    };
  } finally {
    share.fill(0);
    enrollment.disposePreparedShare();
  }
};
