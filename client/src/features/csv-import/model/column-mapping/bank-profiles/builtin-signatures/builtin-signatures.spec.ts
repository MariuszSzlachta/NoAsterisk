import { describe, expect, it } from 'vitest';

import { BUILTIN_SIGNATURES } from '#features/csv-import/model/column-mapping/bank-profiles/builtin-signatures';

describe('BUILTIN_SIGNATURES', () => {
  it('contains all supported banks', () => {
    const names = BUILTIN_SIGNATURES.map((s) => s.displayName);
    expect(names).toContain('mBank');
    expect(names).toContain('PKO BP');
    expect(names).toContain('ING');
    expect(names).toContain('Santander');
    expect(names).toContain('Millennium');
  });

  it('each signature has at least one header pattern', () => {
    const empty = BUILTIN_SIGNATURES.filter(
      (s) => s.headerPatterns.length === 0,
    );
    expect(empty).toHaveLength(0);
  });

  it('each header pattern has at least one element', () => {
    const emptyPatterns = BUILTIN_SIGNATURES.flatMap((s) =>
      s.headerPatterns.filter((p) => p.length === 0),
    );
    expect(emptyPatterns).toHaveLength(0);
  });

  it('has no duplicate display names', () => {
    const names = BUILTIN_SIGNATURES.map((s) => s.displayName);
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });
});
