import { describe, expect, it } from 'vitest';

import { defaultHeaderHeuristicRegistry, HeaderHeuristicRegistry } from './header-heuristic.registry';

describe('HeaderHeuristicRegistry', () => {
  describe('match', () => {
    it('returns field for known PL header', () => {
      expect(defaultHeaderHeuristicRegistry.match('data operacji')).toBe('date');
    });

    it('returns field for known EN header', () => {
      expect(defaultHeaderHeuristicRegistry.match('amount')).toBe('amount');
    });

    it('returns undefined for unknown header', () => {
      expect(defaultHeaderHeuristicRegistry.match('xyz_unknown')).toBeUndefined();
    });

    it('matches debit/credit columns', () => {
      expect(defaultHeaderHeuristicRegistry.match('kwota wn')).toBe('debit');
      expect(defaultHeaderHeuristicRegistry.match('kwota ma')).toBe('credit');
    });
  });

  describe('register', () => {
    it('adds user heuristic that takes priority over builtins', () => {
      const registry = new HeaderHeuristicRegistry();
      registry.register({ normalized: 'custom date', field: 'date', source: 'user' });
      expect(registry.match('custom date')).toBe('date');
    });

    it('user heuristic overrides builtin for same key', () => {
      const registry = new HeaderHeuristicRegistry();
      // 'data' normally maps to 'date', but user can override
      registry.register({ normalized: 'data', field: 'title', source: 'user' });
      expect(registry.match('data')).toBe('title');
    });
  });

  describe('getAll', () => {
    it('returns all entries including user-registered ones', () => {
      const registry = new HeaderHeuristicRegistry();
      const initialCount = registry.getAll().length;
      registry.register({ normalized: 'new_field', field: 'balance', source: 'user' });
      expect(registry.getAll().length).toBe(initialCount + 1);
    });
  });
});
