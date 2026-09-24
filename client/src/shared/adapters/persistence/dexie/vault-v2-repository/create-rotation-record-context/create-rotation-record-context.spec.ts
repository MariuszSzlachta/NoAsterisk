import { describe, expect, it } from 'vitest';

import { createRotationRecordContext } from '#shared/adapters/persistence/dexie/vault-v2-repository/create-rotation-record-context';

describe('createRotationRecordContext', () => {
  it('binds record identity to the complete rotation scope', () => {
    expect(
      createRotationRecordContext(
        {
          accountId: 'account',
          workspaceId: 'workspace',
          vaultId: 'vault',
          keyId: 'key-next',
        },
        'transactions',
        'record',
      ),
    ).toEqual({
      accountId: 'account',
      workspaceId: 'workspace',
      vaultId: 'vault',
      keyId: 'key-next',
      collection: 'transactions',
      recordId: 'record',
    });
  });
});
