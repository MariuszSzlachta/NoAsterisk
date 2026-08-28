import { describe, expect, it } from 'vitest';

import type { TransactionRow } from '#features/csv-import/model/transformation/types';
import { createImportChunks } from '#features/csv-import/model/submission/import-chunks/create-import-chunks';

const makeRow = (overrides: Partial<TransactionRow> = {}): TransactionRow => ({
  id: crypto.randomUUID(),
  date: '2026-06-26',
  title: 'BIEDRONKA',
  amount: -87.43,
  currency: 'PLN',
  status: 'ok',
  ...overrides,
});

describe('createImportChunks', () => {
  const defaultOptions = { batchId: '00000000-0000-0000-0000-000000000001' };

  it('creates single chunk for <= 200 rows', async () => {
    const rows = Array.from({ length: 5 }, (_, i) =>
      makeRow({ id: `row-${i}`, amount: -(i + 1) * 10 }),
    );

    const chunks = await createImportChunks(rows, defaultOptions);

    expect(chunks).toHaveLength(1);
    expect(chunks[0].rows).toHaveLength(5);
    expect(chunks[0].batchId).toBe(defaultOptions.batchId);
  });

  it('splits into multiple chunks when > 200 rows', async () => {
    const rows = Array.from({ length: 450 }, (_, i) =>
      makeRow({ id: `row-${i}`, amount: -(i + 1) }),
    );

    const chunks = await createImportChunks(rows, defaultOptions);

    expect(chunks).toHaveLength(3);
    expect(chunks[0].rows).toHaveLength(200);
    expect(chunks[1].rows).toHaveLength(200);
    expect(chunks[2].rows).toHaveLength(50);
  });

  it('filters out error rows', async () => {
    const rows = [
      makeRow({ id: 'ok', status: 'ok' }),
      makeRow({ id: 'err', status: 'error' }),
      makeRow({ id: 'ok2', status: 'ok', amount: -50 }),
    ];

    const chunks = await createImportChunks(rows, defaultOptions);

    expect(chunks[0].rows).toHaveLength(2);
  });

  it('filters out duplicate rows', async () => {
    const rows = [
      makeRow({ id: 'ok', status: 'ok' }),
      makeRow({ id: 'dup', status: 'duplicate' }),
    ];

    const chunks = await createImportChunks(rows, defaultOptions);

    expect(chunks[0].rows).toHaveLength(1);
  });

  it('includes warning rows', async () => {
    const rows = [
      makeRow({ id: 'ok', status: 'ok' }),
      makeRow({ id: 'warn', status: 'warning', amount: -50 }),
    ];

    const chunks = await createImportChunks(rows, defaultOptions);

    expect(chunks[0].rows).toHaveLength(2);
  });

  it('returns empty array when all rows are errors', async () => {
    const rows = [
      makeRow({ status: 'error' }),
      makeRow({ status: 'duplicate' }),
    ];

    const chunks = await createImportChunks(rows, defaultOptions);

    expect(chunks).toHaveLength(0);
  });

  it('maps amount to absolute value with correct type', async () => {
    const rows = [
      makeRow({ amount: -87.43 }),
      makeRow({ id: 'income', amount: 5000, title: 'SALARY' }),
    ];

    const chunks = await createImportChunks(rows, defaultOptions);

    expect(chunks[0].rows[0].amount).toBe(87.43);
    expect(chunks[0].rows[0].type).toBe('expense');
    expect(chunks[0].rows[1].amount).toBe(5000);
    expect(chunks[0].rows[1].type).toBe('income');
  });

  it('includes sourceFilename and profileId when provided', async () => {
    const rows = [makeRow()];
    const options = {
      batchId: '00000000-0000-0000-0000-000000000001',
      sourceFilename: 'mbank-2026-06.csv',
      profileId: '00000000-0000-0000-0000-000000000002',
    };

    const chunks = await createImportChunks(rows, options);

    expect(chunks[0].sourceFilename).toBe('mbank-2026-06.csv');
    expect(chunks[0].profileId).toBe(options.profileId);
  });

  it('sets valid contentHash per row', async () => {
    const rows = [makeRow()];

    const chunks = await createImportChunks(rows, defaultOptions);

    expect(chunks[0].rows[0].contentHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('all chunks share same batchHash', async () => {
    const rows = Array.from({ length: 250 }, (_, i) =>
      makeRow({ id: `row-${i}`, amount: -(i + 1) }),
    );

    const chunks = await createImportChunks(rows, defaultOptions);

    expect(chunks[0].batchHash).toBe(chunks[1].batchHash);
  });
});
