import { describe, expect, it } from 'vitest';

import type { AnonymizationEntry, TransactionRow } from '#features/csv-import/model/types';
import { buildGridRows } from '#features/csv-import/ui/hooks/useAnonymizationGrid/build-grid-rows';

const buildRow = (id: string, title: string): Pick<TransactionRow, 'id' | 'date' | 'title' | 'amount' | 'currency' | 'balance' | 'category'> => ({
  id,
  date: '2025-01-15',
  title,
  amount: 100,
  currency: 'PLN',
  balance: 500,
  category: 'Groceries',
});

const buildEntry = (anonymizedTitle: string, status: AnonymizationEntry['status']): AnonymizationEntry => ({
  originalTitle: 'Original',
  anonymizedTitle,
  status,
  detections: [],
});

describe('buildGridRows', () => {
  it('maps rows and entries by positional index', () => {
    const rows = [buildRow('r1', 'Title1')];
    const entries = [buildEntry('Anon1', 'anonymized')];
    const result = buildGridRows(rows, entries);

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Anon1');
    expect(result[0].anonymizationStatus).toBe('anonymized');
    expect(result[0].rowIndex).toBe(0);
  });

  it('falls back to row title when entry is missing', () => {
    const rows = [buildRow('r1', 'Original Title')];
    const result = buildGridRows(rows, []);

    expect(result[0].title).toBe('Original Title');
    expect(result[0].anonymizationStatus).toBe('safe');
  });

  it('preserves all row fields in grid row', () => {
    const rows = [buildRow('r1', 'Test')];
    const entries = [buildEntry('Anon', 'safe')];
    const result = buildGridRows(rows, entries);

    expect(result[0]).toMatchObject({
      id: 'r1',
      date: '2025-01-15',
      amount: 100,
      currency: 'PLN',
      balance: 500,
      category: 'Groceries',
    });
  });
});
