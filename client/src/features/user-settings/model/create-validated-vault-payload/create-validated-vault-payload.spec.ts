import { describe, expect, it } from 'vitest';

import { createValidatedVaultPayload } from '#features/user-settings/model/create-validated-vault-payload';

describe('createValidatedVaultPayload', () => {
  it('returns a complete versioned payload for valid local collections', () => {
    const payload = createValidatedVaultPayload({
      transactions: [],
      rules: [],
      categories: [],
      budgets: [],
      periodHistory: [],
      importHistory: [],
    });

    expect(payload.schemaVersion).toBe(1);
    expect(payload.transactions).toEqual([]);
    expect(payload.importHistory).toEqual([]);
  });
});
