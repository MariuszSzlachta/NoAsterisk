import type { vaultRotationChallenges } from '@shared/infrastructure/database/schema';
import { mapRotationChallengeToTranscript } from '@vault-protocol/infrastructure/mappers/mapRotationChallengeToTranscript';
import { buildVaultRotationTranscript } from '@vault-protocol/testing/buildVaultRotationTranscript';
describe('mapRotationChallengeToTranscript', () => {
  it('preserves the complete immutable transcript and nullable secondary envelope', () => {
    const transcript = buildVaultRotationTranscript();
    const value = transcript.snapshot;
    const row: typeof vaultRotationChallenges.$inferSelect = {
      id: '00000000-0000-4000-8000-000000000099',
      userId: value.accountId,
      workspaceId: value.workspaceId,
      vaultId: value.vaultId,
      deviceId: value.deviceId,
      currentKeyId: value.currentKeyId,
      nextKeyId: value.nextKeyId,
      challenge: value.challenge,
      expiresAt: new Date(value.expiresAt),
      currentRecoveryPublicKey: value.currentRecoveryPublicKey,
      nextRecoveryPublicKey: value.nextRecoveryPublicKey,
      signingPublicKey: value.signingPublicKey,
      envelopePurpose: value.envelopePurpose,
      envelope: value.envelope,
      passkeyEnvelope: value.passkeyEnvelope ?? null,
      createdAt: new Date(),
      consumedAt: new Date(),
    };
    expect(mapRotationChallengeToTranscript(row).toSigningBytes()).toEqual(
      transcript.toSigningBytes(),
    );
    expect(() =>
      mapRotationChallengeToTranscript({ ...row, envelopePurpose: 'unknown' }),
    ).toThrow();
  });
});
