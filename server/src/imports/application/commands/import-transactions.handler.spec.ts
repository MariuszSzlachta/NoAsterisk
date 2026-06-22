import {
  ImportTransactionsHandler,
  ImportTransactionsCommand,
  ImportTransactionRow,
  BatchAlreadyImportedError,
} from '@imports/application/commands/import-transactions.handler';
import { ImportBatchRepository } from '@imports/application/ports/import-batch.repository';
import { TransactionRepository } from '@transactions/application/ports/transaction.repository';
import {
  ImportBatch,
  ImportBatchStatus,
} from '@imports/domain/import-batch.entity';
import { DomainError } from '@shared/domain/domain.error';
import { PiiValidationService } from '@imports/application/services/pii-validation.service';
import { AutoCategorizeHandler } from '@categorization-rules/application/commands/auto-categorize.handler';

describe('ImportTransactionsHandler', () => {
  let handler: ImportTransactionsHandler;
  let batchRepo: jest.Mocked<ImportBatchRepository>;
  let transactionRepo: jest.Mocked<TransactionRepository>;
  let piiService: jest.Mocked<PiiValidationService>;
  let autoCategorize: { execute: jest.Mock };

  const buildRow = (
    overrides?: Partial<ImportTransactionRow>,
  ): ImportTransactionRow => ({
    amount: 100,
    currency: 'PLN',
    type: 'expense',
    description: 'BIEDRONKA',
    date: new Date('2026-06-15'),
    categoryIds: [],
    contentHash: 'hash-' + Math.random().toString(36).slice(2),
    ...overrides,
  });

  const buildCommand = (
    overrides?: Partial<ImportTransactionsCommand>,
  ): ImportTransactionsCommand => ({
    batchId: 'batch-001',
    workspaceId: 'ws-001',
    batchHash: 'batch-hash-abc',
    sourceFilename: 'historia.csv',
    rows: [
      buildRow({ contentHash: 'hash-1' }),
      buildRow({ contentHash: 'hash-2' }),
    ],
    ...overrides,
  });

  beforeEach(() => {
    batchRepo = {
      save: jest.fn().mockImplementation((b) => Promise.resolve(b)),
      findById: jest.fn().mockResolvedValue(undefined),
      findByWorkspaceId: jest.fn().mockResolvedValue([]),
      findPaged: jest.fn().mockResolvedValue({
        data: [],
        meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
      }),
      findByBatchHash: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    transactionRepo = {
      save: jest.fn().mockImplementation((t) => Promise.resolve(t)),
      saveMany: jest.fn().mockResolvedValue(undefined),
      findAll: jest.fn().mockResolvedValue([]),
      findById: jest.fn().mockResolvedValue(undefined),
      findPaged: jest.fn().mockResolvedValue({
        data: [],
        meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
      }),
      existsByCategoryId: jest.fn().mockResolvedValue(false),
      existsByContentHash: jest.fn().mockResolvedValue(false),
      findUncategorized: jest.fn().mockResolvedValue([]),
      deleteByBatchId: jest.fn().mockResolvedValue(0),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    piiService = {
      validate: jest.fn().mockReturnValue([]),
    } as unknown as jest.Mocked<PiiValidationService>;
    autoCategorize = { execute: jest.fn().mockResolvedValue({ categorized: 0, total: 0 }) };
    handler = new ImportTransactionsHandler(
      batchRepo,
      transactionRepo,
      piiService,
      autoCategorize as unknown as AutoCategorizeHandler,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('new batch import', () => {
    it('creates batch and saves all transactions', async () => {
      const command = buildCommand();

      const result = await handler.execute(command);

      expect(result.saved).toBe(2);
      expect(result.duplicatesSkipped).toBe(0);
      expect(result.rejected).toEqual([]);
      expect(batchRepo.save).toHaveBeenCalledTimes(2); // create + update
      expect(transactionRepo.save).toHaveBeenCalledTimes(2);
    });

    it('creates batch with correct properties', async () => {
      const command = buildCommand();

      await handler.execute(command);

      const firstSaveCall = batchRepo.save.mock.calls[0];
      const batch = firstSaveCall?.[0] as ImportBatch;
      expect(batch.id).toBe('batch-001');
      expect(batch.workspaceId).toBe('ws-001');
      expect(batch.batchHash).toBe('batch-hash-abc');
      expect(batch.totalRows).toBe(2);
    });

    it('saves transactions with contentHash and importBatchId', async () => {
      const command = buildCommand();

      await handler.execute(command);

      const savedTransaction = transactionRepo.save.mock.calls[0]?.[0];
      expect(savedTransaction?.contentHash).toBe('hash-1');
      expect(savedTransaction?.importBatchId).toBe('batch-001');
    });
  });

  describe('workspace ownership', () => {
    it('throws when batch belongs to different workspace', async () => {
      batchRepo.findById.mockResolvedValue(
        ImportBatch.create({
          id: 'batch-001',
          workspaceId: 'ws-OTHER',
          batchHash: 'batch-hash-abc',
          totalRows: 2,
        }),
      );

      const command = buildCommand({ workspaceId: 'ws-001' });

      await expect(handler.execute(command)).rejects.toThrow(DomainError);
      await expect(handler.execute(command)).rejects.toThrow(
        'Batch does not belong to this workspace',
      );
    });
  });

  describe('deduplication', () => {
    it('skips duplicate transactions by content hash', async () => {
      transactionRepo.existsByContentHash
        .mockResolvedValueOnce(true) // hash-1 exists
        .mockResolvedValueOnce(false); // hash-2 is new

      const command = buildCommand();
      const result = await handler.execute(command);

      expect(result.saved).toBe(1);
      expect(result.duplicatesSkipped).toBe(1);
      expect(transactionRepo.save).toHaveBeenCalledTimes(1);
    });

    it('passes workspaceId to existsByContentHash', async () => {
      const command = buildCommand();
      await handler.execute(command);

      expect(transactionRepo.existsByContentHash).toHaveBeenCalledWith(
        'ws-001',
        'hash-1',
      );
    });

    it('rejects entire batch when batch hash already exists', async () => {
      batchRepo.findByBatchHash.mockResolvedValue(
        ImportBatch.create({
          id: 'existing-batch',
          workspaceId: 'ws-001',
          batchHash: 'batch-hash-abc',
          totalRows: 2,
        }),
      );

      const command = buildCommand();

      await expect(handler.execute(command)).rejects.toThrow(
        BatchAlreadyImportedError,
      );
      await expect(handler.execute(command)).rejects.toThrow(
        'Batch was already imported',
      );
      expect(transactionRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('retry (existing batch)', () => {
    it('appends to existing batch on retry', async () => {
      const existingBatch = ImportBatch.create({
        id: 'batch-001',
        workspaceId: 'ws-001',
        batchHash: 'batch-hash-abc',
        totalRows: 5,
      }).recordSavedRows(3);

      batchRepo.findById.mockResolvedValue(existingBatch);

      const command = buildCommand({
        rows: [buildRow({ contentHash: 'hash-new' })],
        isRetry: true,
      });
      const result = await handler.execute(command);

      expect(result.saved).toBe(1);
      expect(transactionRepo.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('batch status update', () => {
    it('updates batch savedRows after saving transactions', async () => {
      const command = buildCommand();
      await handler.execute(command);

      const lastSaveCall =
        batchRepo.save.mock.calls[batchRepo.save.mock.calls.length - 1];
      const updatedBatch = lastSaveCall?.[0] as ImportBatch;
      expect(updatedBatch.savedRows).toBe(2);
      expect(updatedBatch.status).toBe(ImportBatchStatus.Complete);
    });
  });
});
