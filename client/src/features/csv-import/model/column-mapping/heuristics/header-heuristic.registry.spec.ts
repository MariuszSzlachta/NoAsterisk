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

    it('matches source columns (PL)', () => {
      expect(defaultHeaderHeuristicRegistry.match('nadawca')).toBe('source');
      expect(defaultHeaderHeuristicRegistry.match('zleceniodawca')).toBe('source');
      expect(defaultHeaderHeuristicRegistry.match('nazwa nadawcy')).toBe('source');
      expect(defaultHeaderHeuristicRegistry.match('źródło')).toBe('source');
    });

    it('matches source columns (EN)', () => {
      expect(defaultHeaderHeuristicRegistry.match('sender')).toBe('source');
      expect(defaultHeaderHeuristicRegistry.match('from')).toBe('source');
      expect(defaultHeaderHeuristicRegistry.match('remitter')).toBe('source');
    });

    it('matches recipient columns (PL)', () => {
      expect(defaultHeaderHeuristicRegistry.match('adresat')).toBe('recipient');
      expect(defaultHeaderHeuristicRegistry.match('odbiorca')).toBe('recipient');
      expect(defaultHeaderHeuristicRegistry.match('nazwa odbiorcy')).toBe('recipient');
      expect(defaultHeaderHeuristicRegistry.match('beneficjent')).toBe('recipient');
      expect(defaultHeaderHeuristicRegistry.match('dane kontrahenta')).toBe('recipient');
      expect(defaultHeaderHeuristicRegistry.match('kontrahent')).toBe('recipient');
    });

    it('matches recipient columns (EN)', () => {
      expect(defaultHeaderHeuristicRegistry.match('beneficiary')).toBe('recipient');
      expect(defaultHeaderHeuristicRegistry.match('recipient')).toBe('recipient');
      expect(defaultHeaderHeuristicRegistry.match('payee')).toBe('recipient');
      expect(defaultHeaderHeuristicRegistry.match('counterparty')).toBe('recipient');
      expect(defaultHeaderHeuristicRegistry.match('to')).toBe('recipient');
    });

    it('matches reference columns (PL)', () => {
      expect(defaultHeaderHeuristicRegistry.match('referencja')).toBe('reference');
      expect(defaultHeaderHeuristicRegistry.match('nr referencyjny')).toBe('reference');
      expect(defaultHeaderHeuristicRegistry.match('nr ref')).toBe('reference');
      expect(defaultHeaderHeuristicRegistry.match('numer operacji')).toBe('reference');
      expect(defaultHeaderHeuristicRegistry.match('identyfikator operacji')).toBe('reference');
    });

    it('matches reference columns (EN)', () => {
      expect(defaultHeaderHeuristicRegistry.match('reference')).toBe('reference');
      expect(defaultHeaderHeuristicRegistry.match('ref number')).toBe('reference');
      expect(defaultHeaderHeuristicRegistry.match('transaction id')).toBe('reference');
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
