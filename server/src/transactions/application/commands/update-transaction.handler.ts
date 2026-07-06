import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { TransactionType } from '@budget/domain';
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

export interface UpdateTransactionCommand {
  id: string;
  amount?: number;
  currency?: string;
  type?: 'income' | 'expense' | 'adjustment';
  categoryIds?: string[];
  description?: string;
  date?: Date;
}

const COMMAND_TYPE_MAP: Record<string, TransactionType> = {
  income: TransactionType.Income,
  expense: TransactionType.Expense,
  adjustment: TransactionType.Adjustment,
};

@Injectable()
export class UpdateTransactionHandler {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly repo: TransactionRepository,
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepo: CategoryRepository,
  ) {}

  async execute(
    command: UpdateTransactionCommand,
  ): Promise<TransactionResponseDto> {
    const existing = await this.repo.findById(command.id);
    if (!existing) {
      throw new NotFoundException(`Transaction ${command.id} not found`);
    }

    if (command.categoryIds && command.categoryIds.length > 0) {
      const found = await this.categoryRepo.findByIds(command.categoryIds);
      if (found.length !== command.categoryIds.length) {
        throw new BadRequestException('One or more category IDs are invalid');
      }
    }

    const updated = existing.update({
      amount: command.amount,
      currency: command.currency,
      type: command.type ? COMMAND_TYPE_MAP[command.type] : undefined,
      categoryIds: command.categoryIds,
      description: command.description,
      date: command.date,
    });

    const saved = await this.repo.save(updated);
    return TransactionResponseMapper.toDto(saved);
  }
}
