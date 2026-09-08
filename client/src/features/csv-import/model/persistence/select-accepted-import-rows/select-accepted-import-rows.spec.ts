import { describe, expect, it } from 'vitest';

import type { AnonymizationEntry } from '#features/csv-import/model/anonymization/types/anonymization-entry';
import type { TransactionRow } from '#features/csv-import/model/transformation/types/transaction-row';
import { selectAcceptedImportRows } from '#features/csv-import/model/persistence/select-accepted-import-rows';

const buildRow = (id: string, status: TransactionRow['status']): TransactionRow => ({
  id,
  date: '2026-01-15',
  title: 'Original title',
  amount: -100,
  currency: 'PLN',
  status,
});

const buildEntry = (
  rowIndex: number,
  accepted: boolean,
): AnonymizationEntry => ({
  rowIndex,
  originalTitle: 'Original PII title',
  anonymizedTitle: 'Masked title',
  spans: [],
  status: accepted ? 'safe' : 'needs_review',
  accepted,
});

describe('selectAcceptedImportRows', () => {
  it('selects only importable rows explicitly accepted in review', () => {
    const result = selectAcceptedImportRows(
      [
        buildRow('accepted', 'ok'),
        buildRow('warning', 'warning'),
        buildRow('error', 'error'),
        buildRow('duplicate', 'duplicate'),
      ],
      [
        buildEntry(0, true),
        buildEntry(1, false),
        buildEntry(2, true),
        buildEntry(3, true),
      ],
    );

    expect(result).toEqual([
      { row: buildRow('accepted', 'ok'), rowIndex: 0, description: 'Masked title' },
    ]);
  });

  it('does not select rows without a matching review entry', () => {
    expect(selectAcceptedImportRows([buildRow('orphan', 'ok')], [])).toEqual([]);
  });
});
