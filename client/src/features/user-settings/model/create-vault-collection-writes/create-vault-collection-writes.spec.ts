import { describe, expect, it } from 'vitest';

import { createVaultCollectionWrites } from '#features/user-settings/model/create-vault-collection-writes';
import { createVaultPayload } from '#features/user-settings/model/vault-payload';

describe('createVaultCollectionWrites', () => {
  it('should replace all six collections when a complete snapshot is empty', () => {
    const payload = createVaultPayload({
      transactions: [],
      rules: [],
      categories: [],
      budgets: [],
      periodHistory: [],
      importHistory: [],
    });
    expect(
      createVaultCollectionWrites(payload).map((write) => write.collection),
    ).toEqual([
      'transactions',
      'rules',
      'categories',
      'budgets',
      'period-history',
      'import-history',
    ]);
    expect(
      createVaultCollectionWrites(payload).every(
        (write) => write.records.length === 0,
      ),
    ).toBe(true);
  });
});
