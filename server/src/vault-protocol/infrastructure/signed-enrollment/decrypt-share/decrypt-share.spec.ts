import { DomainError } from '@budget/domain';
import { ServerShareEncryptionAdapter } from '@vault-protocol/infrastructure/server-share-encryption.adapter';
import { decryptSignedEnrollmentShare } from '@vault-protocol/infrastructure/signed-enrollment/decrypt-share';

describe('decryptSignedEnrollmentShare', () => {
  const previousKey = process.env['VAULT_INFRASTRUCTURE_KEY_BASE64'];
  beforeEach(() => {
    process.env['VAULT_INFRASTRUCTURE_KEY_BASE64'] = Buffer.alloc(
      32,
      37,
    ).toString('base64');
  });
  afterEach(() => {
    if (previousKey === undefined)
      delete process.env['VAULT_INFRASTRUCTURE_KEY_BASE64'];
    else process.env['VAULT_INFRASTRUCTURE_KEY_BASE64'] = previousKey;
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });
  it('should return the real encrypted share and fail closed with a domain error for malformed or tampered native storage', () => {
    const share = new Uint8Array(32).fill(7);
    const encrypted = new ServerShareEncryptionAdapter().encrypt(share);
    const restored = decryptSignedEnrollmentShare(JSON.stringify(encrypted));
    try {
      expect(restored).toEqual(share);
      for (const serialized of [
        '{',
        'null',
        '{}',
        JSON.stringify({ ...encrypted, vmk: 'private-root-forbidden' }),
        JSON.stringify({ ...encrypted, authTag: 'invalid' }),
      ]) {
        expect(() => decryptSignedEnrollmentShare(serialized)).toThrow(
          DomainError,
        );
      }
    } finally {
      share.fill(0);
      restored.fill(0);
    }
  });
});
