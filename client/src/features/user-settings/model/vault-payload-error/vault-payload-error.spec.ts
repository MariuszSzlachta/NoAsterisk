import { describe, expect, it } from 'vitest';

import { VaultPayloadError } from '#features/user-settings/model/vault-payload-error';

describe('VaultPayloadError', () => {
  it('identifies payload validation failures without exposing data', () => {
    const error = new VaultPayloadError('Vault payload failed validation');

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('VaultPayloadError');
    expect(error.message).toBe('Vault payload failed validation');
  });
});
