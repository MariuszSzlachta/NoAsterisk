import { mapRecoveryRegistrationToResponse } from '@vault-protocol/application/mappers/map-recovery-registration-response';
import { RecoveryAuthorityRegistration } from '@vault-protocol/domain/entities/recovery-authority-registration';
import { buildRecoveryRegistration } from '@vault-protocol/testing/build-recovery-registration';

describe('recovery registration response projection', () => {
  it('should expose only the public signing transcript and canonical ISO expiry', () => {
    const snapshot = buildRecoveryRegistration();
    expect(
      mapRecoveryRegistrationToResponse(
        new RecoveryAuthorityRegistration(snapshot),
      ),
    ).toEqual({
      accountId: snapshot.userId,
      workspaceId: snapshot.workspaceId,
      vaultId: snapshot.vaultId,
      keyId: snapshot.keyId,
      deviceId: snapshot.deviceId,
      challenge: snapshot.challenge,
      expiresAt: '1970-01-01T00:01:01.000Z',
      signingPublicKey: snapshot.signingPublicKey,
      recoveryPublicKey: snapshot.recoveryPublicKey,
    });
  });
});
