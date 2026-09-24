import { buildVaultRotationTranscript } from '@vault-protocol/testing/buildVaultRotationTranscript';
import { mapRotationTranscriptToResponse } from '@vault-protocol/application/mappers/mapRotationTranscriptToResponse';
describe('mapRotationTranscriptToResponse', () => {
  it('should preserve exact signed public fields and render UTC expiration', () => {
    const transcript = buildVaultRotationTranscript({
      passkeyEnvelope: 'opaque-secondary',
    });
    expect(mapRotationTranscriptToResponse(transcript)).toEqual({
      ...transcript.snapshot,
      expiresAt: new Date(transcript.snapshot.expiresAt).toISOString(),
    });
  });
});
