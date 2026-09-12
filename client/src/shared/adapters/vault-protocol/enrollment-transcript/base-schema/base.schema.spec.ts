import { describe, expect, it } from 'vitest';

import { enrollmentTranscriptBaseSchema } from '#shared/adapters/vault-protocol/enrollment-transcript/base-schema';
import { buildEnrollmentTranscript } from '#shared/adapters/vault-protocol/enrollment-transcript/testing/build-transcript';

describe('enrollment common wire bounds', () => {
  it('should require complete bounded common fields without unrelated extensions', () => {
    const common = Object.fromEntries(
      Object.entries(buildEnrollmentTranscript()).filter(
        ([key]) => key !== 'purpose' && key !== 'recoveryPublicKey',
      ),
    );
    expect(enrollmentTranscriptBaseSchema.safeParse(common).success).toBe(true);
    expect(
      enrollmentTranscriptBaseSchema.safeParse({
        ...common,
        challenge: `${'A'.repeat(42)}\n`,
      }).success,
    ).toBe(false);
    expect(
      enrollmentTranscriptBaseSchema.safeParse({ ...common, deviceId: '' })
        .success,
    ).toBe(false);
    expect(
      enrollmentTranscriptBaseSchema.safeParse({
        ...common,
        signingPublicKey: 'x'.repeat(10_001),
      }).success,
    ).toBe(false);
  });
});
