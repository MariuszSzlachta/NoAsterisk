import { GetImportBatchesHandler } from '@imports/application/queries/get-import-batches.handler';
import { GetImportBatchByIdHandler } from '@imports/application/queries/get-import-batch-by-id.handler';
import { ImportBatchRepository } from '@imports/application/ports/import-batch.repository';
import { ImportBatch, ImportBatchStatus } from '@budget/domain';

interface BatchOverrides {
  id?: string;
  workspaceId?: string;
  batchHash?: string;
  sourceFilename?: string;
  totalRows?: number;
  savedRows?: number;
  status?: ImportBatchStatus;
  importedAt?: Date;
  completedAt?: Date | undefined;
}

const buildBatch = (overrides?: BatchOverrides): ImportBatch => {
  return new ImportBatch(
    overrides?.id ?? 'batch-001',
    overrides?.workspaceId ?? 'ws-001',
    overrides?.batchHash ?? 'hash-abc',
    overrides?.sourceFilename ?? 'file.csv',
    overrides?.totalRows ?? 10,
    overrides?.savedRows ?? 10,
    overrides?.status ?? ImportBatchStatus.Complete,
    overrides?.importedAt ?? new Date('2026-06-01'),
    overrides?.completedAt ?? new Date('2026-06-01'),
  );
};

const buildRepo = (): jest.Mocked<ImportBatchRepository> => ({
  save: jest.fn(),
  findById: jest.fn(),
  findByWorkspaceId: jest.fn(),
  findPaged: jest.fn(),
  findByBatchHash: jest.fn(),
  delete: jest.fn(),
});

describe('GetImportBatchesHandler', () => {
  let handler: GetImportBatchesHandler;
  let repo: jest.Mocked<ImportBatchRepository>;

  beforeEach(() => {
    repo = buildRepo();
    handler = new GetImportBatchesHandler(repo);
  });

  afterEach(() => jest.clearAllMocks());

  it('returns paginated batches from repo', async () => {
    const b1 = buildBatch({ id: 'b1' });
    const b2 = buildBatch({ id: 'b2' });
    repo.findPaged.mockResolvedValue({
      data: [b2, b1],
      meta: { page: 1, limit: 10, total: 2, totalPages: 1 },
    });

    const result = await handler.execute({
      workspaceId: 'ws-001',
      page: 1,
      limit: 10,
    });

    expect(result.data).toHaveLength(2);
    expect(result.meta).toEqual({
      page: 1,
      limit: 10,
      total: 2,
      totalPages: 1,
    });
    expect(repo.findPaged).toHaveBeenCalledWith('ws-001', {
      page: 1,
      limit: 10,
    });
  });

  it('returns empty result for no batches', async () => {
    repo.findPaged.mockResolvedValue({
      data: [],
      meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
    });

    const result = await handler.execute({
      workspaceId: 'ws-001',
      page: 1,
      limit: 10,
    });

    expect(result.data).toHaveLength(0);
    expect(result.meta.total).toBe(0);
  });
});

describe('GetImportBatchByIdHandler', () => {
  let handler: GetImportBatchByIdHandler;
  let repo: jest.Mocked<ImportBatchRepository>;

  beforeEach(() => {
    repo = buildRepo();
    handler = new GetImportBatchByIdHandler(repo);
  });

  afterEach(() => jest.clearAllMocks());

  it('returns batch DTO when found', async () => {
    const batch = buildBatch({ id: 'b1', workspaceId: 'ws-001' });
    repo.findById.mockResolvedValue(batch);

    const result = await handler.execute({ workspaceId: 'ws-001', id: 'b1' });

    expect(result?.id).toBe('b1');
    expect(result?.status).toBe('Complete');
  });

  it('returns undefined when not found', async () => {
    repo.findById.mockResolvedValue(undefined);

    const result = await handler.execute({ workspaceId: 'ws-001', id: 'nope' });

    expect(result).toBeUndefined();
  });

  it('returns undefined when workspace mismatch', async () => {
    const batch = buildBatch({ id: 'b1', workspaceId: 'ws-other' });
    repo.findById.mockResolvedValue(batch);

    const result = await handler.execute({ workspaceId: 'ws-001', id: 'b1' });

    expect(result).toBeUndefined();
  });
});
