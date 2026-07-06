import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { Transaction, TransactionType } from '@budget/domain';
import {
  TRANSACTION_REPOSITORY,
  TransactionRepository,
} from '@transactions/application/ports/transaction.repository';
import {
  CATEGORY_REPOSITORY,
  CategoryRepository,
} from '@categories/application/ports/category.repository';
import { TransactionResponseDto } from '@transactions/application/dto/transaction-response.dto';
import { TransactionResponseMapper } from '@transactions/application/mappers/transaction-response.mapper';

export interface CreateTransactionCommand {
  workspaceId: string;
  accountId: string;
  amount: number;
  currency: string;
  type: 'income' | 'expense' | 'adjustment';
  categoryIds: string[];
  description: string;
  date: Date;
}

const COMMAND_TYPE_MAP: Record<
  CreateTransactionCommand['type'],
  TransactionType
> = {
  income: TransactionType.Income,
  expense: TransactionType.Expense,
  adjustment: TransactionType.Adjustment,
};

@Injectable()
export class CreateTransactionHandler {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly repo: TransactionRepository,
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepo: CategoryRepository,
  ) {}

  async execute(
    command: CreateTransactionCommand,
  ): Promise<TransactionResponseDto> {
    if (command.categoryIds.length > 0) {
      const found = await this.categoryRepo.findByIds(command.categoryIds);
      if (found.length !== command.categoryIds.length) {
        throw new BadRequestException('One or more category IDs are invalid');
      }
    }

    const transaction = Transaction.create({
      workspaceId: command.workspaceId,
      accountId: command.accountId,
      amount: command.amount,
      currency: command.currency,
      type: COMMAND_TYPE_MAP[command.type],
      categoryIds: command.categoryIds,
      description: command.description,
      date: command.date,
    });
    const saved = await this.repo.save(transaction);
    return TransactionResponseMapper.toDto(saved);
  }
}
