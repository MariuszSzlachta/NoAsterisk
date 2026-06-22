import { Injectable, Inject } from '@nestjs/common';
import {
  TRANSACTION_REPOSITORY,
  TransactionRepository,
  TransactionFilter,
  TransactionSortField,
} from '@transactions/application/ports/transaction.repository';
import { TransactionResponseDto } from '@transactions/application/dto/transaction-response.dto';
import { TransactionResponseMapper } from '@transactions/application/mappers/transaction-response.mapper';
import {
  PagedQuery,
  PagedResult,
} from '@shared/application/types/paged-query.types';

export interface GetTransactionsPagedQuery {
  workspaceId: string;
  paged: PagedQuery<TransactionFilter, TransactionSortField>;
}

@Injectable()
export class GetTransactionsPagedHandler {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly repo: TransactionRepository,
  ) {}

  async execute(
    query: GetTransactionsPagedQuery,
  ): Promise<PagedResult<TransactionResponseDto>> {
    const result = await this.repo.findPaged(query.workspaceId, query.paged);
    return {
      data: result.data.map(TransactionResponseMapper.toDto),
      meta: result.meta,
    };
  }
}
