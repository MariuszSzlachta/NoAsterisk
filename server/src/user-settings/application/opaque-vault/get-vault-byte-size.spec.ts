import { getVaultByteSize } from '@user-settings/application/opaque-vault/get-vault-byte-size';

describe('getVaultByteSize', () => {
  it('measures UTF-8 bytes rather than JavaScript characters', () => {
    expect(getVaultByteSize('ą')).toBe(2);
  });
});
