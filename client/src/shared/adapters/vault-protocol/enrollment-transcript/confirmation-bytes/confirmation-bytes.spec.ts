import { describe, expect, it } from 'vitest';

import { encodeEnrollmentConfirmation } from '#shared/adapters/vault-protocol/enrollment-transcript';
import { buildEnrollmentTranscript } from '#shared/adapters/vault-protocol/enrollment-transcript/testing/build-transcript';

describe('browser signed enrollment confirmation', () => {
  it('should bind final digest and exact challenge/context using a distinct purpose domain', () => {
    const input = buildEnrollmentTranscript();
    expect(
      new TextDecoder().decode(
        encodeEnrollmentConfirmation(input, 'b'.repeat(64)),
      ),
    ).toBe(
      '["budgetflow/enrollment-confirm/v2",2,"HKDF-SHA256/AES-256-GCM","account","workspace","vault","key","device","AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA","1970-01-01T00:01:01.000Z","bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"]',
    );
    expect(() => encodeEnrollmentConfirmation(input, 'B'.repeat(64))).toThrow();
    expect(() =>
      encodeEnrollmentConfirmation(input, `${'b'.repeat(63)}\n`),
    ).toThrow();
    expect(() =>
      encodeEnrollmentConfirmation(input, 'b'.repeat(64) + '\n'),
    ).toThrow();
  });
});
