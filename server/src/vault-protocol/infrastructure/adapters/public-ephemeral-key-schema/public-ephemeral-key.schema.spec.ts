import { generateKeyPairSync } from 'node:crypto';
import { publicEphemeralKeySchema } from '@vault-protocol/infrastructure/adapters/public-ephemeral-key-schema';

describe('strict public enrollment ECDH key', () => {
  it('should accept a native P-256 public key with empty public usages', () => {
    const pair = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
    expect(
      publicEphemeralKeySchema.safeParse({
        ...pair.publicKey.export({ format: 'jwk' }),
        ext: true,
        key_ops: [],
      }).success,
    ).toBe(true);
  });
  it('should reject private or signing-purpose keys', () => {
    const pair = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
    expect(
      publicEphemeralKeySchema.safeParse(
        pair.privateKey.export({ format: 'jwk' }),
      ).success,
    ).toBe(false);
    expect(
      publicEphemeralKeySchema.safeParse({
        ...pair.publicKey.export({ format: 'jwk' }),
        key_ops: ['verify'],
      }).success,
    ).toBe(false);
  });
});
