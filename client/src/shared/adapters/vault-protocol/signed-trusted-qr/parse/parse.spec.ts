import { describe, expect, it } from 'vitest';

import { createSignedTrustedFixture } from '#shared/adapters/vault-protocol/signed-trusted-enrollment/testing/create-signed-trusted-fixture';
import { parseSignedTrustedQr } from '#shared/adapters/vault-protocol/signed-trusted-qr/parse';

describe('parseSignedTrustedQr', () => {
  it('roundtrips both public packets without accepting legacy or root-secret fields', async () => {
    const fixture = await createSignedTrustedFixture();
    try {
      expect(parseSignedTrustedQr(JSON.stringify(fixture.request))).toEqual(
        fixture.request,
      );
      expect(parseSignedTrustedQr(JSON.stringify(fixture.response))).toEqual(
        fixture.response,
      );
      for (const text of [
        'null',
        '[]',
        '{',
        JSON.stringify(fixture.request.transferRequest),
        JSON.stringify({ ...fixture.response, recoverySeed: 'secret' }),
        ' '.repeat(32_769),
      ]) {
        expect(() => parseSignedTrustedQr(text)).toThrow();
      }
    } finally {
      fixture.vmk.fill(0);
    }
  });
});
