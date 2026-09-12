import { describe, expect, it } from 'vitest';

import { enrollmentTranscriptSchema } from '#shared/adapters/vault-protocol/enrollment-transcript/schema';
import { buildEnrollmentTranscript } from '#shared/adapters/vault-protocol/enrollment-transcript/testing/build-transcript';

describe('strict enrollment wire metadata', () => {
  it('should accept the canonical bounded metadata', () => {
    expect(
      enrollmentTranscriptSchema.safeParse(buildEnrollmentTranscript()).success,
    ).toBe(true);
  });
  it.each([
    { recoveryPublicKey: 'A'.repeat(64) },
    { recoveryPublicKey: 'a'.repeat(64) + '\n' },
    { challenge: 'A'.repeat(43) + '\n' },
    { signingPublicKey: 'x'.repeat(10_001) },
    { expiresAt: 61_001 },
    { accountId: '' },
    { recoverySeed: 'forbidden' },
    { purpose: 'legacy' },
  ])('should reject malformed, unsupported or private fields: %j', (fields) => {
    expect(
      enrollmentTranscriptSchema.safeParse({
        ...buildEnrollmentTranscript(),
        ...fields,
      }).success,
    ).toBe(false);
  });
});
