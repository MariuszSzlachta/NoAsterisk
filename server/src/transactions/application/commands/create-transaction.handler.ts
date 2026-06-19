import { Injectable, Inject } from '@nestjs/common';
import { Transaction, TransactionType } from '@transactions/domain/transaction.entity';
import {
  TRANSACTION_REPOSITORY,
  TransactionRepository,
} from '@transactions/application/ports/transaction.repository';
import { TransactionResponseDto } from '@transactions/application/dto/transaction-response.dto';
import { TransactionResponseMapper } from '@transactions/application/mappers/transaction-response.mapper';

export interface CreateTransactionCommand {
  amount: number;
  currency: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  date: Date;
}

const COMMAND_TYPE_MAP: Record<CreateTransactionCommand['type'], TransactionType> = {
  income: TransactionType.Income,
  expense: TransactionType.Expense,
};

@Injectable()
export class CreateTransactionHandler {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly repo: TransactionRepository,
  ) {}

  async execute(command: CreateTransactionCommand): Promise<TransactionResponseDto> {
    const transaction = Transaction.create({
      ...command,
      type: COMMAND_TYPE_MAP[command.type],
    });
    const saved = await this.repo.save(transaction);
    return TransactionResponseMapper.toDto(saved);
  }
}
