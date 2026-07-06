import { describe, it, expect } from 'vitest';
import { ImportBatch, ImportBatchStatus } from '#domain/import-batch/import-batch.entity';
import { DomainError } from '#domain/shared/domain-error';

describe('ImportBatch', () => {
  const validProps = {
    workspaceId: 'ws-001',
    batchHash: 'abc123hash',
    sourceFilename: 'historia_2026-06.csv',
    totalRows: 100,
  };

  describe('create', () => {
    it('creates batch with generated ID, Pending status, and zero saved rows', () => {
      const batch = ImportBatch.create(validProps);

      expect(batch.id).toBeDefined();
      expect(batch.id.length).toBeGreaterThan(0);
      expect(batch.workspaceId).toBe('ws-001');
      expect(batch.batchHash).toBe('abc123hash');
      expect(batch.sourceFilename).toBe('historia_2026-06.csv');
      expect(batch.totalRows).toBe(100);
      expect(batch.savedRows).toBe(0);
      expect(batch.status).toBe(ImportBatchStatus.Pending);
      expect(batch.completedAt).toBeUndefined();
    });

    it('generates unique IDs', () => {
      const batch1 = ImportBatch.create(validProps);
      const batch2 = ImportBatch.create(validProps);
      expect(batch1.id).not.toBe(batch2.id);
    });

    it('creates batch without sourceFilename', () => {
      const batch = ImportBatch.create({
        ...validProps,
        sourceFilename: undefined,
      });

      expect(batch.sourceFilename).toBeUndefined();
    });
  });

  describe('constructor invariants', () => {
    it('throws when id is empty', () => {
      expect(() =>
        new ImportBatch('', 'ws-1', 'hash', undefined, 10, 0, ImportBatchStatus.Pending, new Date(), undefined),
      ).toThrow(DomainError);
    });

    it('throws when workspaceId is empty', () => {
      expect(() =>
        new ImportBatch('id-1', '', 'hash', undefined, 10, 0, ImportBatchStatus.Pending, new Date(), undefined),
      ).toThrow(DomainError);
    });

    it('throws when batchHash is empty', () => {
      expect(() =>
        new ImportBatch('id-1', 'ws-1', '', undefined, 10, 0, ImportBatchStatus.Pending, new Date(), undefined),
      ).toThrow(DomainError);
    });

    it('throws when totalRows is negative', () => {
      expect(() =>
        new ImportBatch('id-1', 'ws-1', 'hash', undefined, -1, 0, ImportBatchStatus.Pending, new Date(), undefined),
      ).toThrow(DomainError);
    });

    it('throws when savedRows is negative', () => {
      expect(() =>
        new ImportBatch('id-1', 'ws-1', 'hash', undefined, 10, -1, ImportBatchStatus.Pending, new Date(), undefined),
      ).toThrow(DomainError);
    });

    it('throws when savedRows exceeds totalRows', () => {
      expect(() =>
        new ImportBatch('id-1', 'ws-1', 'hash', undefined, 10, 11, ImportBatchStatus.Pending, new Date(), undefined),
      ).toThrow(DomainError);
    });
  });

  describe('recordSavedRows', () => {
    it('transitions to Complete when all rows saved', () => {
      const batch = ImportBatch.create({ ...validProps, totalRows: 50 });

      const updated = batch.recordSavedRows(50);

      expect(updated.savedRows).toBe(50);
      expect(updated.status).toBe(ImportBatchStatus.Complete);
      expect(updated.completedAt).toBeInstanceOf(Date);
    });

    it('transitions to InProgress when not all rows saved yet', () => {
      const batch = ImportBatch.create({ ...validProps, totalRows: 100 });

      const updated = batch.recordSavedRows(80);

      expect(updated.savedRows).toBe(80);
      expect(updated.status).toBe(ImportBatchStatus.InProgress);
      expect(updated.completedAt).toBeUndefined();
    });

    it('accumulates saved rows across multiple calls', () => {
      const batch = ImportBatch.create({ ...validProps, totalRows: 100 });

      const after1 = batch.recordSavedRows(40);
      const after2 = after1.recordSavedRows(60);

      expect(after2.savedRows).toBe(100);
      expect(after2.status).toBe(ImportBatchStatus.Complete);
    });

    it('throws when count is zero', () => {
      const batch = ImportBatch.create(validProps);

      expect(() => batch.recordSavedRows(0)).toThrow(
        'Saved rows count must be positive',
      );
    });

    it('throws when count is negative', () => {
      const batch = ImportBatch.create(validProps);

      expect(() => batch.recordSavedRows(-5)).toThrow(
        'Saved rows count must be positive',
      );
    });

    it('throws when count would exceed totalRows', () => {
      const batch = ImportBatch.create({ ...validProps, totalRows: 100 });

      expect(() => batch.recordSavedRows(101)).toThrow(
        'Saved rows count would exceed totalRows',
      );
    });
  });

  describe('markPartiallyRejected', () => {
    it('sets status to PartiallyRejected with completedAt', () => {
      const batch = ImportBatch.create(validProps);
      const updated = batch.recordSavedRows(80);

      const rejected = updated.markPartiallyRejected();

      expect(rejected.status).toBe(ImportBatchStatus.PartiallyRejected);
      expect(rejected.savedRows).toBe(80);
      expect(rejected.completedAt).toBeInstanceOf(Date);
    });

    it('throws when batch is Pending', () => {
      const batch = ImportBatch.create(validProps);

      expect(() => batch.markPartiallyRejected()).toThrow(
        'Can only mark InProgress batch as partially rejected',
      );
    });
  });

  describe('isComplete', () => {
    it('returns false for Pending batch', () => {
      const batch = ImportBatch.create(validProps);
      expect(batch.isComplete()).toBe(false);
    });

    it('returns true for Complete batch', () => {
      const batch = ImportBatch.create({ ...validProps, totalRows: 10 });
      const complete = batch.recordSavedRows(10);
      expect(complete.isComplete()).toBe(true);
    });
  });

  describe('isDuplicate', () => {
    it('returns true when batch hashes match', () => {
      const batch = ImportBatch.create(validProps);
      expect(batch.isDuplicate('abc123hash')).toBe(true);
    });

    it('returns false when batch hashes differ', () => {
      const batch = ImportBatch.create(validProps);
      expect(batch.isDuplicate('different-hash')).toBe(false);
    });
  });
});
