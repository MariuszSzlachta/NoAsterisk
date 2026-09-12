import { DomainError } from '@budget/domain';
import { SignedEnrollment } from '@vault-protocol/domain/entities/signed-enrollment';
import { mapSignedEnrollmentToPreparation } from '@vault-protocol/application/mappers/map-signed-enrollment-preparation';
import { buildEnrollmentTranscript } from '@vault-protocol/testing/build-enrollment-transcript';

describe('mapSignedEnrollmentToPreparation', () => {
  it('should expose only public intent and the server half, never lifecycle, private share ownership or roots', () => {
    const intent = buildEnrollmentTranscript();
    const entity = new SignedEnrollment(
      { intent, state: { kind: 'pending' } },
      new Uint8Array(32).fill(7),
    );
    const mapped = mapSignedEnrollmentToPreparation(entity);
    expect(mapped).toEqual({
      intent: { ...intent, deviceEnvelope: '{}' },
      serverShare: Buffer.alloc(32, 7).toString('base64'),
    });
    expect(Object.keys(mapped).sort()).toEqual(['intent', 'serverShare']);
    expect(() => entity.copyPreparedShare()).toThrow(DomainError);
    expect(() => mapSignedEnrollmentToPreparation(entity)).toThrow(DomainError);
    expect(() =>
      mapSignedEnrollmentToPreparation(entity.consume('b'.repeat(64))),
    ).toThrow(DomainError);
  });
  it('should preserve trusted public delegation fields without adding recovery authority', () => {
    const common = buildEnrollmentTranscript();
    const intent = {
      purpose: 'trusted',
      accountId: common.accountId,
      workspaceId: common.workspaceId,
      vaultId: common.vaultId,
      keyId: common.keyId,
      deviceId: common.deviceId,
      challenge: common.challenge,
      createdAt: common.createdAt,
      expiresAt: common.expiresAt,
      signingPublicKey: common.signingPublicKey,
      deviceEnvelope: '{}',
      oldDeviceId: 'approver',
      newEphemeralPublicKey: '{}',
      delegationDigest: '0'.repeat(64),
    };
    const mapped = mapSignedEnrollmentToPreparation(
      new SignedEnrollment(
        {
          intent: { ...intent, purpose: 'trusted' },
          state: { kind: 'pending' },
        },
        new Uint8Array(32),
      ),
    );
    expect(mapped.intent).toEqual(intent);
    expect(mapped.intent).not.toHaveProperty('recoveryPublicKey');
  });
});
