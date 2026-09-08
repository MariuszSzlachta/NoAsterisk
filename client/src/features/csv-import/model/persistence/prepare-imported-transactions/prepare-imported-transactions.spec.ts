import { describe, expect, it } from 'vitest';

import type { AnonymizationEntry } from '#features/csv-import/model/anonymization/types/anonymization-entry';
import type { TransactionRow } from '#features/csv-import/model/transformation/types/transaction-row';
import { prepareImportedTransactions } from '#features/csv-import/model/persistence/prepare-imported-transactions';

const buildRow = (
  id: string,
  overrides: Partial<TransactionRow> = {},
): TransactionRow => ({
  id,
  date: '2026-01-15',
  title: 'Original title',
  amount: -100,
  currency: 'PLN',
  status: 'ok',
  ...overrides,
});

const buildEntry = (
  rowIndex: number,
  overrides: Partial<AnonymizationEntry> = {},
): AnonymizationEntry => ({
  rowIndex,
  originalTitle: 'Original PII title',
  anonymizedTitle: 'Masked title',
  spans: [],
  status: 'safe',
  accepted: true,
  ...overrides,
});

describe('prepareImportedTransactions', () => {
  it('maps accepted rows and reports rows excluded before persistence', async () => {
    const result = await prepareImportedTransactions(
      [
        buildRow('accepted'),
        buildRow('review', { amount: -200 }),
        buildRow('invalid', { status: 'error', statusReason: 'Invalid amount' }),
        buildRow('duplicate', { status: 'duplicate', statusReason: 'Already imported' }),
        buildRow('missing'),
        buildRow('unimportable', { status: 'error' }),
      ],
      [
        buildEntry(0),
        buildEntry(1, { accepted: false, status: 'needs_review' }),
        buildEntry(2),
        buildEntry(3),
      ],
      'batch-1',
      '2026-01-15T12:00:00.000Z',
    );

    expect(result.records).toHaveLength(1);
    expect(result.records[0]?.description).toBe('Masked title');
    expect(result.records[0]?.contentHash).toMatch(/^[a-f0-9]{64}$/);
    expect(result.records[0]).not.toHaveProperty('originalTitle');
    expect(result.rejectedRows).toEqual([
      { rowIndex: 1, reason: 'Anonymization review was not accepted' },
      { rowIndex: 2, reason: 'Invalid amount' },
      { rowIndex: 3, reason: 'Already imported' },
      { rowIndex: 4, reason: 'Anonymization review was not accepted' },
      { rowIndex: 5, reason: 'Row is not eligible for import' },
    ]);
  });

  it('rejects invalid accepted rows before returning a write set', async () => {
    await expect(
      prepareImportedTransactions(
        [buildRow('invalid', { amount: Number.NaN })],
        [buildEntry(0)],
        'batch-1',
        '2026-01-15T12:00:00.000Z',
      ),
    ).rejects.toThrow('not valid for local persistence');
  });

  it('returns an empty write set when no rows were accepted', async () => {
    const result = await prepareImportedTransactions(
      [buildRow('review')],
      [buildEntry(0, { accepted: false, status: 'needs_review' })],
      'batch-1',
      '2026-01-15T12:00:00.000Z',
    );

    expect(result.records).toEqual([]);
    expect(result.rejectedRows).toEqual([
      { rowIndex: 0, reason: 'Anonymization review was not accepted' },
    ]);
  });
});
