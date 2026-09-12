import { describe, expect, it } from 'vitest';

import { encodeEnrollmentDelegation } from '#shared/adapters/vault-protocol/enrollment-transcript';
import { buildEnrollmentTranscript } from '#shared/adapters/vault-protocol/enrollment-transcript/testing/build-transcript';
import { buildTrustedEnrollmentTranscript } from '#shared/adapters/vault-protocol/enrollment-transcript/testing/build-trusted-transcript';

describe('browser enrollment delegation parity', () => {
  it('should match the frozen backend delegation bytes and refuse recovery delegation', () => {
    expect(
      new TextDecoder().decode(
        encodeEnrollmentDelegation(buildTrustedEnrollmentTranscript()),
      ),
    ).toBe(
      '["budgetflow/enrollment-delegation/v2",2,"HKDF-SHA256/AES-256-GCM","account","workspace","vault","key","device","AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA","1970-01-01T00:01:01.000Z","approver","{\\"public\\":\\"signing\\"}","{\\"public\\":\\"ephemeral\\"}"]',
    );
    expect(() =>
      encodeEnrollmentDelegation(buildEnrollmentTranscript()),
    ).toThrow();
  });
});
