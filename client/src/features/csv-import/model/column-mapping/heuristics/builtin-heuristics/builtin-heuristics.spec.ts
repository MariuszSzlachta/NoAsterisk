import { describe, expect, it } from 'vitest';

import { BUILTIN_HEURISTICS } from '#features/csv-import/model/column-mapping/heuristics/builtin-heuristics';
import { HEURISTIC_SOURCE_BUILTIN } from '#features/csv-import/model/column-mapping/heuristics/heuristic-source-builtin';

describe('BUILTIN_HEURISTICS', () => {
  it('contains entries for all domain fields', () => {
    const fields = new Set(BUILTIN_HEURISTICS.map((h) => h.field));
    expect(fields.has('date')).toBe(true);
    expect(fields.has('title')).toBe(true);
    expect(fields.has('amount')).toBe(true);
    expect(fields.has('currency')).toBe(true);
    expect(fields.has('balance')).toBe(true);
    expect(fields.has('debit')).toBe(true);
    expect(fields.has('credit')).toBe(true);
    expect(fields.has('category')).toBe(true);
    expect(fields.has('source')).toBe(true);
    expect(fields.has('recipient')).toBe(true);
    expect(fields.has('counterpart')).toBe(true);
    expect(fields.has('reference')).toBe(true);
  });

  it('all entries have builtin source', () => {
    const nonBuiltin = BUILTIN_HEURISTICS.filter(
      (h) => h.source !== HEURISTIC_SOURCE_BUILTIN,
    );
    expect(nonBuiltin).toHaveLength(0);
  });

  it('all entries have non-empty normalized header', () => {
    const empty = BUILTIN_HEURISTICS.filter((h) => h.normalized.trim() === '');
    expect(empty).toHaveLength(0);
  });

  it('has no duplicate normalized headers', () => {
    const normalized = BUILTIN_HEURISTICS.map((h) => h.normalized);
    const unique = new Set(normalized);
    expect(unique.size).toBe(normalized.length);
  });
});
