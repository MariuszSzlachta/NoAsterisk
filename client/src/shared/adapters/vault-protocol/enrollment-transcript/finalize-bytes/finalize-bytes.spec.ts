import { describe, expect, it } from 'vitest';

import { encodeEnrollmentFinalize } from '#shared/adapters/vault-protocol/enrollment-transcript';
import { buildEnrollmentTranscript } from '#shared/adapters/vault-protocol/enrollment-transcript/testing/build-transcript';

describe('browser enrollment finalize parity', () => {
  it('should match the frozen backend UTF-8 vector exactly', () => {
    expect(
      new TextDecoder().decode(
        encodeEnrollmentFinalize(buildEnrollmentTranscript()),
      ),
    ).toBe(
      '["budgetflow/enrollment-finalize/v2",2,"HKDF-SHA256/AES-256-GCM","recovery","account","workspace","vault","key","device","AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA","1970-01-01T00:01:01.000Z","{\\"public\\":\\"signing\\"}",null,null,"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","{\\"ciphertext\\":\\"device\\"}",null]',
    );
  });
  it('should bind exact envelopes, optional passkey and purpose, and reject invalid context', () => {
    const input = buildEnrollmentTranscript();
    const original = encodeEnrollmentFinalize(input);
    expect(
      encodeEnrollmentFinalize({
        ...input,
        deviceEnvelope: '{ "ciphertext": "device" }',
      }),
    ).not.toEqual(original);
    expect(
      encodeEnrollmentFinalize({ ...input, passkeyEnvelope: '{}' }),
    ).not.toEqual(original);
    expect(
      encodeEnrollmentFinalize({ ...input, purpose: 'initial' }),
    ).not.toEqual(original);
    expect(() =>
      encodeEnrollmentFinalize({ ...input, expiresAt: 61_001 }),
    ).toThrow();
    expect(() =>
      encodeEnrollmentFinalize({
        ...input,
        deviceEnvelope: '\\'.repeat(20_000),
        passkeyEnvelope: '\\'.repeat(20_000),
      }),
    ).toThrow();
  });
});
