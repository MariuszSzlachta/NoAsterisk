import { describe, expect, it } from 'vitest';

import { createHeuristicRegistry } from './create-heuristic-registry';
import { defaultHeuristicRegistry } from './default-heuristic-registry';

describe('defaultHeuristicRegistry', () => {
  describe('match', () => {
    it('returns field for known PL header', () => {
      expect(defaultHeuristicRegistry.match('data operacji')).toBe('date');
    });

    it('returns field for known EN header', () => {
      expect(defaultHeuristicRegistry.match('amount')).toBe('amount');
    });

    it('returns undefined for unknown header', () => {
      expect(defaultHeuristicRegistry.match('xyz_unknown')).toBeUndefined();
    });

    it('matches debit/credit columns', () => {
      expect(defaultHeuristicRegistry.match('kwota wn')).toBe('debit');
      expect(defaultHeuristicRegistry.match('kwota ma')).toBe('credit');
    });

    it.each([
      ['nadawca', 'source'],
      ['zleceniodawca', 'source'],
      ['nazwa nadawcy', 'source'],
      ['źródło', 'source'],
      ['sender', 'source'],
      ['from', 'source'],
      ['remitter', 'source'],
    ] as const)('matches source column "%s" → %s', (header, expected) => {
      expect(defaultHeuristicRegistry.match(header)).toBe(expected);
    });

    it.each([
      ['adresat', 'recipient'],
      ['odbiorca', 'recipient'],
      ['nazwa odbiorcy', 'recipient'],
      ['beneficjent', 'recipient'],
      ['dane kontrahenta', 'recipient'],
      ['kontrahent', 'recipient'],
      ['counterparty', 'recipient'],
      ['beneficiary', 'recipient'],
      ['recipient', 'recipient'],
      ['payee', 'recipient'],
      ['to', 'recipient'],
    ] as const)('matches recipient column "%s" → %s', (header, expected) => {
      expect(defaultHeuristicRegistry.match(header)).toBe(expected);
    });

    it.each([
      ['referencja', 'reference'],
      ['nr referencyjny', 'reference'],
      ['nr ref', 'reference'],
      ['numer operacji', 'reference'],
      ['identyfikator operacji', 'reference'],
      ['reference', 'reference'],
      ['ref number', 'reference'],
      ['transaction id', 'reference'],
    ] as const)('matches reference column "%s" → %s', (header, expected) => {
      expect(defaultHeuristicRegistry.match(header)).toBe(expected);
    });
  });
});

describe('createHeuristicRegistry', () => {
  describe('register', () => {
    it('returns new registry with user heuristic taking priority', () => {
      const registry = createHeuristicRegistry();
      const extended = registry.register({ normalized: 'custom date', field: 'date', source: 'user' });

      expect(extended.match('custom date')).toBe('date');
      expect(registry.match('custom date')).toBeUndefined();
    });

    it('user heuristic overrides builtin for same key', () => {
      const overridden = createHeuristicRegistry().register({ normalized: 'data', field: 'title', source: 'user' });
      expect(overridden.match('data')).toBe('title');
    });
  });

  describe('getAll', () => {
    it('includes registered heuristics', () => {
      const registry = createHeuristicRegistry();
      const extended = registry.register({ normalized: 'new_field', field: 'balance', source: 'user' });
      expect(extended.getAll().length).toBe(registry.getAll().length + 1);
    });
  });
});
