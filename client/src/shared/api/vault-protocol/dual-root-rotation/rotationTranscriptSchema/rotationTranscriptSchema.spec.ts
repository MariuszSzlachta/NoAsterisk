import { describe, expect, it } from 'vitest';

import { buildRotationFixture } from '#shared/adapters/vault-protocol/dual-root-vault-rotation/testing/buildRotationFixture';
import { rotationTranscriptSchema } from '#shared/api/vault-protocol/dual-root-rotation/rotationTranscriptSchema';

describe('rotationTranscriptSchema', () => {
  it('should accept an exact transcript and reject ambiguous or substituted fields', async () => {
    const f = await buildRotationFixture();
    expect(rotationTranscriptSchema.safeParse(f.transcript).success).toBe(true);
    expect(
      rotationTranscriptSchema.safeParse({
        ...f.transcript,
        challenge: '!'.repeat(43),
      }).success,
    ).toBe(false);
    expect(
      rotationTranscriptSchema.safeParse({
        ...f.transcript,
        envelopePurpose: 'passkey-wrap',
        passkeyEnvelope: 'secondary',
      }).success,
    ).toBe(false);
    expect(
      rotationTranscriptSchema.safeParse({
        ...f.transcript,
        recoverySeed: 'secret',
      }).success,
    ).toBe(false);
  });
});
