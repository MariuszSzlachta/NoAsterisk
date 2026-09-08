import { describe, expect, it } from 'vitest';

import { createVaultPayload, isVaultPayload } from '#features/user-settings/model/vault-payload';

const buildEmptyPayload = () =>
  createVaultPayload({
    transactions: [],
    rules: [],
    categories: [],
    budgets: [],
    periodHistory: [],
    importHistory: [],
  });

describe('isVaultPayload', () => {
  it('accepts a complete empty snapshot', () => {
    expect(isVaultPayload(buildEmptyPayload())).toBe(true);
  });

  it.each([
    ['missing collection', { importHistory: undefined }],
    ['unknown envelope field', { unexpected: true }],
  ])('rejects a payload with %s', (_caseName, overrides) => {
    expect(isVaultPayload({ ...buildEmptyPayload(), ...overrides })).toBe(false);
  });
});
