import { Injectable, Inject } from '@nestjs/common';
import {
  TRANSACTION_REPOSITORY,
  TransactionRepository,
} from '@transactions/application/ports/transaction.repository';
import { TransactionResponseDto } from '@transactions/application/dto/transaction-response.dto';
import { TransactionResponseMapper } from '@transactions/application/mappers/transaction-response.mapper';

@Injectable()
export class GetTransactionsHandler {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly repo: TransactionRepository,
  ) {}

  async execute(): Promise<TransactionResponseDto[]> {
    const transactions = await this.repo.findAll();
    return transactions.map(TransactionResponseMapper.toDto);
  }
}
