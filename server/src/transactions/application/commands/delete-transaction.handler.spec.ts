import { NotFoundException } from '@nestjs/common';
import { DeleteTransactionHandler } from '@transactions/application/commands/delete-transaction.handler';
import { TransactionRepository } from '@transactions/application/ports/transaction.repository';
import {
  WORKSPACE_A,
  WORKSPACE_B,
  buildMockTransactionRepo,
  buildTransaction,
} from '@transactions/application/__test-helpers__/transaction.builders';

describe('DeleteTransactionHandler', () => {
  let handler: DeleteTransactionHandler;
  let repo: jest.Mocked<TransactionRepository>;

  beforeEach(() => {
    repo = buildMockTransactionRepo();
    handler = new DeleteTransactionHandler(repo);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('deletes transaction when workspace matches', async () => {
    const existing = buildTransaction({ id: 'tx-1', workspaceId: WORKSPACE_A });
    repo.findById.mockResolvedValue(existing);

    await handler.execute({ id: 'tx-1', workspaceId: WORKSPACE_A });

    expect(repo.delete).toHaveBeenCalledWith('tx-1');
  });

  it('throws NotFoundException when transaction belongs to different workspace', async () => {
    const existing = buildTransaction({ id: 'tx-1', workspaceId: WORKSPACE_A });
    repo.findById.mockResolvedValue(existing);

    await expect(
      handler.execute({ id: 'tx-1', workspaceId: WORKSPACE_B }),
    ).rejects.toThrow(NotFoundException);

    expect(repo.delete).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when transaction does not exist', async () => {
    repo.findById.mockResolvedValue(undefined);

    await expect(
      handler.execute({ id: 'non-existent', workspaceId: WORKSPACE_A }),
    ).rejects.toThrow(NotFoundException);
  });
});
