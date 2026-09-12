import { describe, expect, it } from 'vitest';
import { deviceSigningKey } from '#shared/adapters/vault-protocol/device-signing-key';

describe('deviceSigningKey', () => {
  it('creates a non-extractable signing key and exports only the public JWK', async () => {
    const pair = await deviceSigningKey.generate();
    const publicJwk = await deviceSigningKey.exportPublicJwk(pair.publicKey);

    expect(pair.privateKey.extractable).toBe(false);
    expect(pair.privateKey.usages).toEqual(['sign']);
    expect(publicJwk).toMatchObject({ kty: 'EC', crv: 'P-256' });
    expect(publicJwk).not.toHaveProperty('d');
  });
});
