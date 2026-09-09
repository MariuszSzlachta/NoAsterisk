import { createVaultContentHash } from '@user-settings/application/opaque-vault/create-vault-content-hash';

describe('createVaultContentHash', () => {
  it('returns a stable SHA-256 transport hash', () => {
    expect(createVaultContentHash('ciphertext')).toBe(
      '305531dcc50ebca31cf1d5b31e9fc76ed51f66b3b6dd5a030c6539ae6532f979',
    );
  });
});
