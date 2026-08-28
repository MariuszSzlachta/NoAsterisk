import { describe, expect, it } from 'vitest';

import type { TransactionRow } from '#features/csv-import/model/transformation/types';
import { isImportableRow } from '#features/csv-import/model/submission/import-chunks/is-importable-row';

const makeRow = (status: TransactionRow['status']): TransactionRow => ({
  id: 'test',
  date: '2026-06-26',
  title: 'TEST',
  amount: -10,
  currency: 'PLN',
  status,
});

describe('isImportableRow', () => {
  it('returns true for ok status', () => {
    expect(isImportableRow(makeRow('ok'))).toBe(true);
  });

  it('returns true for warning status', () => {
    expect(isImportableRow(makeRow('warning'))).toBe(true);
  });

  it('returns false for error status', () => {
    expect(isImportableRow(makeRow('error'))).toBe(false);
  });

  it('returns false for duplicate status', () => {
    expect(isImportableRow(makeRow('duplicate'))).toBe(false);
  });
});
