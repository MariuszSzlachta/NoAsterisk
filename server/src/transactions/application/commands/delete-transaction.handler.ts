import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  TRANSACTION_REPOSITORY,
  TransactionRepository,
} from '@transactions/application/ports/transaction.repository';

export interface DeleteTransactionCommand {
  id: string;
}

@Injectable()
export class DeleteTransactionHandler {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly repo: TransactionRepository,
  ) {}

  async execute(command: DeleteTransactionCommand): Promise<void> {
    const existing = await this.repo.findById(command.id);
    if (!existing) {
      throw new NotFoundException(`Transaction ${command.id} not found`);
    }
    await this.repo.delete(command.id);
  }
}
