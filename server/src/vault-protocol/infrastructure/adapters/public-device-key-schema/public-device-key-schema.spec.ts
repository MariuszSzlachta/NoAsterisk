import { publicDeviceKeySchema } from '@vault-protocol/infrastructure/adapters/public-device-key-schema';
import { buildVaultSignatureFixture } from '@vault-protocol/testing/build-vault-signature-fixture';

describe('public device signing key schema', () => {
  it('should accept only a public P-256 verification key', () => {
    const fixture = buildVaultSignatureFixture();
    const publicKey: unknown = JSON.parse(fixture.devicePublicKey);
    expect(publicDeviceKeySchema.safeParse(publicKey).success).toBe(true);
    expect(
      publicDeviceKeySchema.safeParse(
        fixture.devicePrivateKey.export({ format: 'jwk' }),
      ).success,
    ).toBe(false);
  });

  it.each([
    undefined,
    null,
    [],
    { kty: 'EC', crv: 'P-384', x: 'a'.repeat(43), y: 'a'.repeat(43) },
    { kty: 'EC', crv: 'P-256', x: 'a', y: 'a'.repeat(43) },
    {
      kty: 'EC',
      crv: 'P-256',
      x: 'a'.repeat(43),
      y: 'a'.repeat(43),
      key_ops: ['sign'],
    },
  ])('should reject malformed or incompatible native-key input', (value) => {
    expect(publicDeviceKeySchema.safeParse(value).success).toBe(false);
  });
});
