import { describe, expect, it } from 'vitest';

import { computeImportContentHash } from '#features/csv-import/model/persistence/compute-import-content-hash';

describe('computeImportContentHash', () => {
  it('returns a stable SHA-256 hex hash for the persisted fields', async () => {
    const first = await computeImportContentHash('2026-01-15', -100, 'Safe title');
    const second = await computeImportContentHash('2026-01-15', -100, ' safe TITLE ');

    expect(first).toMatch(/^[a-f0-9]{64}$/);
    expect(first).toBe(second);
  });

  it('changes when a persisted field changes', async () => {
    const original = await computeImportContentHash('2026-01-15', -100, 'Safe title');
    const changed = await computeImportContentHash('2026-01-16', -100, 'Safe title');

    expect(original).not.toBe(changed);
  });
});
