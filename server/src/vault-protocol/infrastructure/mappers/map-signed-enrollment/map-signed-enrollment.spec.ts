import { DomainError } from '@budget/domain';
import { signedEnrollmentChallenges } from '@shared/infrastructure/database/schema';
import { SignedEnrollment } from '@vault-protocol/domain/entities/signed-enrollment';
import { mapRowToSignedEnrollment } from '@vault-protocol/infrastructure/mappers/map-signed-enrollment';
import { buildEnrollmentTranscript } from '@vault-protocol/testing/build-enrollment-transcript';

describe('mapRowToSignedEnrollment', () => {
  const intent = buildEnrollmentTranscript();
  const row: typeof signedEnrollmentChallenges.$inferSelect = {
    id: 'row',
    userId: intent.accountId,
    workspaceId: intent.workspaceId,
    vaultId: intent.vaultId,
    deviceId: intent.deviceId,
    challenge: intent.challenge,
    intent: JSON.stringify({ intent, state: { kind: 'pending' } }),
    encryptedShare: '{}',
    createdAt: new Date(intent.createdAt),
    expiresAt: new Date(intent.expiresAt),
    consumedAt: null,
    confirmedAt: null,
  };
  it('should return a rich scoped entity rather than raw storage fields or a share', () => {
    const mapped = mapRowToSignedEnrollment(row);
    expect(mapped).toBeInstanceOf(SignedEnrollment);
    expect(mapped.snapshot).toEqual({ intent, state: { kind: 'pending' } });
    expect(() => mapped.copyPreparedShare()).toThrow(DomainError);
  });
  it('should reject malformed JSON, private fields, scope mismatches and inconsistent lifetime metadata', () => {
    for (const substitution of [
      { intent: '{' },
      {
        intent: JSON.stringify({
          intent: { ...intent, recoverySeed: 'secret' },
          state: { kind: 'pending' },
        }),
      },
      { userId: 'other' },
      { workspaceId: 'other' },
      { vaultId: 'other' },
      { deviceId: 'other' },
      { challenge: 'B'.repeat(43) },
      { createdAt: new Date(intent.createdAt + 1) },
      { expiresAt: new Date(intent.expiresAt + 1) },
      { consumedAt: new Date(2_000) },
      { confirmedAt: new Date(2_000) },
    ]) {
      expect(() =>
        mapRowToSignedEnrollment({ ...row, ...substitution }),
      ).toThrow(DomainError);
    }
  });
  it('should validate finalized/active recorded timestamps rather than trusting only nullable flags', () => {
    const finalized = {
      ...row,
      intent: JSON.stringify({
        intent,
        state: { kind: 'finalized', digest: 'b'.repeat(64) },
      }),
      consumedAt: new Date(2_000),
    };
    expect(mapRowToSignedEnrollment(finalized).snapshot.state.kind).toBe(
      'finalized',
    );
    const active = {
      ...finalized,
      intent: JSON.stringify({
        intent,
        state: { kind: 'active', digest: 'b'.repeat(64) },
      }),
      confirmedAt: new Date(3_000),
    };
    expect(mapRowToSignedEnrollment(active).snapshot.state.kind).toBe('active');
    for (const substitution of [
      { consumedAt: new Date(NaN) },
      { consumedAt: new Date(intent.createdAt - 1) },
      { consumedAt: new Date(intent.expiresAt) },
      { confirmedAt: new Date(1_999) },
      { confirmedAt: new Date(intent.expiresAt) },
      { confirmedAt: null },
    ])
      expect(() =>
        mapRowToSignedEnrollment({ ...active, ...substitution }),
      ).toThrow(DomainError);
  });
});
