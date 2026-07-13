import { describe, expect, it } from 'vitest';

import { mapStoredToViewModel } from './transformers';
import type { CategoryInfo, StoredTransaction } from './types';

// ─── Test Data Builder ───────────────────────────────────────────

const DEFAULTS: StoredTransaction = {
  id: 'tx-1',
  date: '2026-06-15',
  description: 'BIEDRONKA – Zakupy spożywcze',
  amount: -87.43,
  currency: 'PLN',
  categoryId: 'cat-groceries',
  accountName: 'mBank',
  contentHash: 'abc123',
  batchId: 'batch-1',
  importedAt: '2026-06-15T10:00:00Z',
};

const buildStored = (
  overrides?: Partial<StoredTransaction>,
): StoredTransaction => ({
  ...DEFAULTS,
  ...overrides,
});

const CATEGORIES: ReadonlyMap<string, CategoryInfo> = new Map([
  ['cat-groceries', { id: 'cat-groceries', label: 'Spożywcze', color: '#4ade80' }],
  ['cat-salary', { id: 'cat-salary', label: 'Wynagrodzenie', color: '#60a5fa' }],
]);

// ─── Tests ───────────────────────────────────────────────────────

describe('mapStoredToViewModel', () => {
  describe('title splitting', () => {
    it('splits on en-dash separator', () => {
      const vm = mapStoredToViewModel(
        buildStored({ description: 'BIEDRONKA – Zakupy spożywcze' }),
      );
      expect(vm.merchant).toBe('BIEDRONKA');
      expect(vm.description).toBe('Zakupy spożywcze');
    });

    it('splits on em-dash separator', () => {
      const vm = mapStoredToViewModel(
        buildStored({ description: 'LIDL—artykuły domowe' }),
      );
      expect(vm.merchant).toBe('LIDL');
      expect(vm.description).toBe('artykuły domowe');
    });

    it('splits on pipe separator', () => {
      const vm = mapStoredToViewModel(
        buildStored({ description: 'ALLEGRO | Zamówienie #12345' }),
      );
      expect(vm.merchant).toBe('ALLEGRO');
      expect(vm.description).toBe('Zamówienie #12345');
    });

    it('splits on forward slash with space', () => {
      const vm = mapStoredToViewModel(
        buildStored({ description: 'PRZELEW / Jan Kowalski' }),
      );
      expect(vm.merchant).toBe('PRZELEW');
      expect(vm.description).toBe('Jan Kowalski');
    });

    it('splits on backslash with trailing space', () => {
      const vm = mapStoredToViewModel(
        buildStored({ description: 'TRANSFER\\ Ref 98765' }),
      );
      expect(vm.merchant).toBe('TRANSFER');
      expect(vm.description).toBe('Ref 98765');
    });

    it('does NOT split hyphenated compound words', () => {
      const vm = mapStoredToViewModel(
        buildStored({ description: 'PRZELEW-WYCH' }),
      );
      expect(vm.merchant).toBe('PRZELEW-WYCH');
      expect(vm.description).toBe('');
    });

    it('does NOT split slash references without spaces', () => {
      const vm = mapStoredToViewModel(
        buildStored({ description: 'REF/2026/06' }),
      );
      expect(vm.merchant).toBe('REF/2026/06');
      expect(vm.description).toBe('');
    });

    it('splits hyphen only when surrounded by spaces', () => {
      const vm = mapStoredToViewModel(
        buildStored({ description: 'PRZELEW-WYCH - Wynagrodzenie' }),
      );
      expect(vm.merchant).toBe('PRZELEW-WYCH');
      expect(vm.description).toBe('Wynagrodzenie');
    });

    it('splits on double space', () => {
      const vm = mapStoredToViewModel(
        buildStored({ description: 'UBER  Przejazd centrum' }),
      );
      expect(vm.merchant).toBe('UBER');
      expect(vm.description).toBe('Przejazd centrum');
    });

    it('splits only on first separator occurrence', () => {
      const vm = mapStoredToViewModel(
        buildStored({ description: 'ABC – DEF – GHI' }),
      );
      expect(vm.merchant).toBe('ABC');
      expect(vm.description).toBe('DEF – GHI');
    });

    it('uses full text as merchant when no separator found', () => {
      const vm = mapStoredToViewModel(
        buildStored({ description: 'SPOTIFY' }),
      );
      expect(vm.merchant).toBe('SPOTIFY');
      expect(vm.description).toBe('');
    });

    it('handles empty description', () => {
      const vm = mapStoredToViewModel(
        buildStored({ description: '' }),
      );
      expect(vm.merchant).toBe('');
      expect(vm.description).toBe('');
    });
  });

  describe('date formatting', () => {
    it('formats ISO date to DD.MM.YYYY', () => {
      const vm = mapStoredToViewModel(buildStored({ date: '2026-06-15' }));
      expect(vm.dateFormatted).toBe('15.06.2026');
    });

    it('preserves original ISO date in date field', () => {
      const vm = mapStoredToViewModel(buildStored({ date: '2026-01-03' }));
      expect(vm.date).toBe('2026-01-03');
      expect(vm.dateFormatted).toBe('03.01.2026');
    });

    it('returns raw string if not ISO format', () => {
      const vm = mapStoredToViewModel(buildStored({ date: 'invalid' }));
      expect(vm.dateFormatted).toBe('invalid');
    });
  });

  describe('transaction type', () => {
    it('returns expense for negative amount', () => {
      const vm = mapStoredToViewModel(buildStored({ amount: -100 }));
      expect(vm.type).toBe('expense');
    });

    it('returns income for positive amount', () => {
      const vm = mapStoredToViewModel(buildStored({ amount: 8500 }));
      expect(vm.type).toBe('income');
    });

    it('returns income for zero amount', () => {
      const vm = mapStoredToViewModel(buildStored({ amount: 0 }));
      expect(vm.type).toBe('income');
    });
  });

  describe('category resolution', () => {
    it('resolves category label and color from map', () => {
      const vm = mapStoredToViewModel(
        buildStored({ categoryId: 'cat-groceries' }),
        CATEGORIES,
      );
      expect(vm.categoryLabel).toBe('Spożywcze');
      expect(vm.categoryColor).toBe('#4ade80');
    });

    it('returns undefined label/color when categoryId not in map', () => {
      const vm = mapStoredToViewModel(
        buildStored({ categoryId: 'cat-unknown' }),
        CATEGORIES,
      );
      expect(vm.categoryLabel).toBeUndefined();
      expect(vm.categoryColor).toBeUndefined();
    });

    it('returns undefined label/color when no categoryId', () => {
      const vm = mapStoredToViewModel(
        buildStored({ categoryId: undefined }),
        CATEGORIES,
      );
      expect(vm.categoryId).toBeUndefined();
      expect(vm.categoryLabel).toBeUndefined();
      expect(vm.categoryColor).toBeUndefined();
    });

    it('returns undefined label/color when no categories map provided', () => {
      const vm = mapStoredToViewModel(
        buildStored({ categoryId: 'cat-groceries' }),
      );
      expect(vm.categoryId).toBe('cat-groceries');
      expect(vm.categoryLabel).toBeUndefined();
    });
  });

  describe('passthrough fields', () => {
    it('preserves id, amount, currency, accountName', () => {
      const vm = mapStoredToViewModel(
        buildStored({
          id: 'tx-42',
          amount: -249,
          currency: 'EUR',
          accountName: 'Revolut',
        }),
      );
      expect(vm.id).toBe('tx-42');
      expect(vm.amount).toBe(-249);
      expect(vm.currency).toBe('EUR');
      expect(vm.accountName).toBe('Revolut');
    });
  });
});
