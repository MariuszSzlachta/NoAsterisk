import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  TRANSACTION_REPOSITORY,
  TransactionRepository,
} from '@transactions/application/ports/transaction.repository';

export interface DeleteTransactionCommand {
  id: string;
  workspaceId: string;
}

@Injectable()
export class DeleteTransactionHandler {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly repo: TransactionRepository,
  ) {}

  async execute(command: DeleteTransactionCommand): Promise<void> {
    const existing = await this.repo.findById(command.id);
    if (!existing || existing.workspaceId !== command.workspaceId) {
      throw new NotFoundException(`Transaction ${command.id} not found`);
    }
    // Ownership verified above — repo.delete uses id-only for port simplicity.
    // All callers MUST verify workspace before invoking delete.
    await this.repo.delete(command.id);
  }
}
