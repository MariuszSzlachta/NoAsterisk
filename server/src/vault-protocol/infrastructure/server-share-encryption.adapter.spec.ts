import { ServerShareEncryptionAdapter } from '@vault-protocol/infrastructure/server-share-encryption.adapter';

describe('ServerShareEncryptionAdapter', () => {
  beforeEach(() => {
    process.env['VAULT_INFRASTRUCTURE_KEY_BASE64'] = Buffer.alloc(
      32,
      4,
    ).toString('base64');
  });

  it('encrypts ServerShare at rest and decrypts it only with the infrastructure key', () => {
    const adapter = new ServerShareEncryptionAdapter();
    const serverShare = new Uint8Array(32).fill(9);
    const encrypted = adapter.encrypt(serverShare);

    expect(encrypted.ciphertext).not.toContain(serverShare.toString());
    expect(encrypted.nonce).not.toBe('');
    expect(encrypted.authTag).not.toBe('');
    expect(adapter.decrypt(encrypted)).toEqual(serverShare);
  });

  it('rejects tampered ciphertext and invalid shares', () => {
    const adapter = new ServerShareEncryptionAdapter();
    expect(() => adapter.encrypt(new Uint8Array(31))).toThrow();
    const encrypted = adapter.encrypt(new Uint8Array(32));
    const tamperedCiphertext = `${encrypted.ciphertext.slice(0, -1)}${
      encrypted.ciphertext.endsWith('A') ? 'B' : 'A'
    }`;
    expect(() =>
      adapter.decrypt({ ...encrypted, ciphertext: tamperedCiphertext }),
    ).toThrow();
  });

  it('rejects malformed or truncated infrastructure fields before decrypting', () => {
    const adapter = new ServerShareEncryptionAdapter();
    const encrypted = adapter.encrypt(new Uint8Array(32));

    expect(() =>
      adapter.decrypt({ ...encrypted, nonce: 'not-base64' }),
    ).toThrow();
    expect(() =>
      adapter.decrypt({ ...encrypted, nonce: encrypted.nonce.slice(0, -4) }),
    ).toThrow();
    expect(() =>
      adapter.decrypt({
        ...encrypted,
        authTag: encrypted.authTag.slice(0, -4),
      }),
    ).toThrow();
    expect(() =>
      adapter.decrypt({
        ...encrypted,
        ciphertext: encrypted.ciphertext.slice(0, -4),
      }),
    ).toThrow();
  });
});
