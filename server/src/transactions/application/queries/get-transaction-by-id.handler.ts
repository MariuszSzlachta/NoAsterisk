import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  TRANSACTION_REPOSITORY,
  TransactionRepository,
} from '@transactions/application/ports/transaction.repository';
import { TransactionResponseDto } from '@transactions/application/dto/transaction-response.dto';
import { TransactionResponseMapper } from '@transactions/application/mappers/transaction-response.mapper';

@Injectable()
export class GetTransactionByIdHandler {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly repo: TransactionRepository,
  ) {}

  async execute(id: string): Promise<TransactionResponseDto> {
    const transaction = await this.repo.findById(id);
    if (!transaction) {
      throw new NotFoundException(`Transaction ${id} not found`);
    }
    return TransactionResponseMapper.toDto(transaction);
  }
}
