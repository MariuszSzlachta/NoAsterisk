import { NotFoundException } from '@nestjs/common';
import { GetTransactionByIdHandler } from '@transactions/application/queries/get-transaction-by-id.handler';
import { TransactionRepository } from '@transactions/application/ports/transaction.repository';
import {
  WORKSPACE_A,
  WORKSPACE_B,
  buildMockTransactionRepo,
  buildTransaction,
} from '@transactions/application/__test-helpers__/transaction.builders';

describe('GetTransactionByIdHandler', () => {
  let handler: GetTransactionByIdHandler;
  let repo: jest.Mocked<TransactionRepository>;

  beforeEach(() => {
    repo = buildMockTransactionRepo();
    handler = new GetTransactionByIdHandler(repo);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('returns transaction when workspace matches', async () => {
    const tx = buildTransaction({ id: 'tx-1', workspaceId: WORKSPACE_A });
    repo.findById.mockResolvedValue(tx);

    const result = await handler.execute({
      id: 'tx-1',
      workspaceId: WORKSPACE_A,
    });

    expect(result.id).toBe('tx-1');
  });

  it('throws NotFoundException when transaction belongs to different workspace', async () => {
    const tx = buildTransaction({ id: 'tx-1', workspaceId: WORKSPACE_A });
    repo.findById.mockResolvedValue(tx);

    await expect(
      handler.execute({ id: 'tx-1', workspaceId: WORKSPACE_B }),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws NotFoundException when transaction does not exist', async () => {
    repo.findById.mockResolvedValue(undefined);

    await expect(
      handler.execute({ id: 'non-existent', workspaceId: WORKSPACE_A }),
    ).rejects.toThrow(NotFoundException);
  });
});
