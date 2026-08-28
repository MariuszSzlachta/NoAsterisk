import { describe, expect, it } from 'vitest';

import { defaultHeuristicRegistry } from '#features/csv-import/model/column-mapping/heuristics/default-heuristic-registry';

describe('defaultHeuristicRegistry', () => {
  it('is created with builtin heuristics', () => {
    expect(defaultHeuristicRegistry.getAll().length).toBeGreaterThan(0);
  });

  it('matches known headers', () => {
    expect(defaultHeuristicRegistry.match('data operacji')).toBe('date');
    expect(defaultHeuristicRegistry.match('kwota')).toBe('amount');
  });

  it('returns undefined for unknown headers', () => {
    expect(defaultHeuristicRegistry.match('totally_unknown')).toBeUndefined();
  });
});
