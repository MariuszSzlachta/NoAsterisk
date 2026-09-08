import { describe, expect, it } from 'vitest';

import {
  canonicalizeVaultRecords,
  createVaultPayload,
  serializeVaultPayload,
} from '#features/user-settings/model/vault-payload';

const buildEmptyPayload = () =>
  createVaultPayload({
    transactions: [],
    rules: [],
    categories: [],
    budgets: [],
    periodHistory: [],
    importHistory: [],
  });

describe('vault canonicalization', () => {
  it('uses stable key ordering for the same logical records', () => {
    const payload = buildEmptyPayload();

    expect(serializeVaultPayload(payload)).toBe(
      '{"budgets":[],"categories":[],"createdAt":"' +
        payload.createdAt +
        '","importHistory":[],"periodHistory":[],"rules":[],"schemaVersion":1,"transactions":[]}',
    );
    expect(canonicalizeVaultRecords(payload)).toBe(
      '{"budgets":[],"categories":[],"importHistory":[],"periodHistory":[],"rules":[],"transactions":[]}',
    );
  });
});
