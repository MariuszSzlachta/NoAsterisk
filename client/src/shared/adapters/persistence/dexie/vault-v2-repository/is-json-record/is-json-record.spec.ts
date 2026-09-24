import { describe, expect, it } from 'vitest';

import { isJsonRecord } from '#shared/adapters/persistence/dexie/vault-v2-repository/is-json-record';

describe('isJsonRecord', () => {
  it('accepts plain object records', () => {
    expect(isJsonRecord({ value: 'synthetic' })).toBe(true);
  });

  it('rejects null and arrays', () => {
    expect(isJsonRecord(null)).toBe(false);
    expect(isJsonRecord([])).toBe(false);
  });
});
