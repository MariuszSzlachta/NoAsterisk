import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  TRANSACTION_REPOSITORY,
  TransactionRepository,
} from '@transactions/application/ports/transaction.repository';
import { TransactionResponseDto } from '@transactions/application/dto/transaction-response.dto';
import { TransactionResponseMapper } from '@transactions/application/mappers/transaction-response.mapper';

export interface GetTransactionByIdQuery {
  id: string;
  workspaceId: string;
}

@Injectable()
export class GetTransactionByIdHandler {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly repo: TransactionRepository,
  ) {}

  async execute(
    query: GetTransactionByIdQuery,
  ): Promise<TransactionResponseDto> {
    const transaction = await this.repo.findById(query.id);
    if (!transaction || transaction.workspaceId !== query.workspaceId) {
      throw new NotFoundException(`Transaction ${query.id} not found`);
    }
    return TransactionResponseMapper.toDto(transaction);
  }
}
