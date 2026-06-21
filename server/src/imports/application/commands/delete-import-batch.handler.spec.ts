import { DeleteImportBatchHandler } from '@imports/application/commands/delete-import-batch.handler';
import { ImportBatchRepository } from '@imports/application/ports/import-batch.repository';
import { TransactionRepository } from '@transactions/application/ports/transaction.repository';
import {
  ImportBatch,
  ImportBatchStatus,
} from '@imports/domain/import-batch.entity';

describe('DeleteImportBatchHandler', () => {
  let handler: DeleteImportBatchHandler;
  let batchRepo: jest.Mocked<ImportBatchRepository>;
  let transactionRepo: jest.Mocked<
    Pick<TransactionRepository, 'deleteByBatchId'>
  >;

  const buildBatch = (id: string, workspaceId: string): ImportBatch =>
    new ImportBatch(
      id,
      workspaceId,
      'hash',
      'file.csv',
      5,
      5,
      ImportBatchStatus.Complete,
      new Date(),
      new Date(),
    );

  beforeEach(() => {
    batchRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findByWorkspaceId: jest.fn(),
      findPaged: jest.fn(),
      findByBatchHash: jest.fn(),
      delete: jest.fn(),
    };
    transactionRepo = { deleteByBatchId: jest.fn() };
    handler = new DeleteImportBatchHandler(
      batchRepo,
      transactionRepo as unknown as TransactionRepository,
    );
  });

  afterEach(() => jest.clearAllMocks());

  it('deletes transactions and batch, returns true', async () => {
    batchRepo.findById.mockResolvedValue(buildBatch('b1', 'ws-001'));
    transactionRepo.deleteByBatchId.mockResolvedValue(3);

    const result = await handler.execute({ workspaceId: 'ws-001', id: 'b1' });

    expect(result).toBe(true);
    expect(transactionRepo.deleteByBatchId).toHaveBeenCalledWith(
      'ws-001',
      'b1',
    );
    expect(batchRepo.delete).toHaveBeenCalledWith('b1');
  });

  it('returns false when batch not found', async () => {
    batchRepo.findById.mockResolvedValue(undefined);

    const result = await handler.execute({ workspaceId: 'ws-001', id: 'nope' });

    expect(result).toBe(false);
  });

  it('returns false when workspace mismatch', async () => {
    batchRepo.findById.mockResolvedValue(buildBatch('b1', 'ws-other'));

    const result = await handler.execute({ workspaceId: 'ws-001', id: 'b1' });

    expect(result).toBe(false);
  });
});
