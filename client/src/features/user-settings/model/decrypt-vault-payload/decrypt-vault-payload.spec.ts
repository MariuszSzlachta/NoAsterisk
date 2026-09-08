import { describe, expect, it } from 'vitest';

import { parseVaultPayload } from '#features/user-settings/model/decrypt-vault-payload';

describe('parseVaultPayload', () => {
  it('returns the legacy compatibility shape for an unversioned payload', () => {
    const payload = parseVaultPayload(
      JSON.stringify({ transactions: [], rules: [] }),
    );

    expect(payload.schemaVersion).toBe(0);
    expect(payload.transactions).toEqual([]);
    expect(payload.rules).toEqual([]);
  });

  it('rejects malformed JSON before restore can start', () => {
    expect(() => parseVaultPayload('{not-json')).toThrow('not valid JSON');
  });
});
