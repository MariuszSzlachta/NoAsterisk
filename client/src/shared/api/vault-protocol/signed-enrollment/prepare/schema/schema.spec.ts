import { describe, expect, it } from 'vitest';

import { buildEnrollmentTranscript } from '#shared/adapters/vault-protocol/enrollment-transcript/testing/build-transcript';
import { signedEnrollmentPreparationSchema } from '#shared/api/vault-protocol/signed-enrollment/prepare/schema';

describe('enrollment preparation reply', () => {
  it('should accept one opaque 32-byte share and reject private roots or incomplete replies', () => {
    const reply = {
      intent: buildEnrollmentTranscript(),
      serverShare: btoa(String.fromCharCode(...new Uint8Array(32))),
    };
    expect(signedEnrollmentPreparationSchema.safeParse(reply).success).toBe(
      true,
    );
    expect(
      signedEnrollmentPreparationSchema.safeParse({
        ...reply,
        vmk: 'forbidden',
      }).success,
    ).toBe(false);
    expect(
      signedEnrollmentPreparationSchema.safeParse({ intent: reply.intent })
        .success,
    ).toBe(false);
  });
});
