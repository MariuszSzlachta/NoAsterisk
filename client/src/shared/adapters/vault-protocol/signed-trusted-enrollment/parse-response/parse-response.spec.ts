import { describe, expect, it } from 'vitest';

import { parseSignedTrustedResponse } from '#shared/adapters/vault-protocol/signed-trusted-enrollment/parse-response';
import { createSignedTrustedFixture } from '#shared/adapters/vault-protocol/signed-trusted-enrollment/testing/create-signed-trusted-fixture';

describe('parseSignedTrustedResponse', () => {
  it('accepts only a v2 packet with a complete lower-case raw P-256 delegation signature', async () => {
    const fixture = await createSignedTrustedFixture();
    try {
      expect(parseSignedTrustedResponse(fixture.response)).toEqual(
        fixture.response,
      );
      expect(() =>
        parseSignedTrustedResponse({
          ...fixture.response,
          delegationSignature: `${'a'.repeat(127)}\n`,
        }),
      ).toThrow();
      for (const value of [
        fixture.response.transferResponse,
        { ...fixture.response, vmk: 'secret' },
        { ...fixture.response, delegationSignature: 'a'.repeat(127) },
        { ...fixture.response, delegationSignature: 'A'.repeat(128) },
        { ...fixture.response, delegationSignature: `${'a'.repeat(128)}\n` },
        {
          ...fixture.response,
          intent: {
            ...fixture.response.intent,
            recoveryPublicKey: 'a'.repeat(64),
          },
        },
      ]) {
        expect(() => parseSignedTrustedResponse(value)).toThrow();
      }
    } finally {
      fixture.vmk.fill(0);
    }
  });
});
