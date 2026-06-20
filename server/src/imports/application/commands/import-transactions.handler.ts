import { Injectable, Inject } from '@nestjs/common';
import {
  IMPORT_BATCH_REPOSITORY,
  ImportBatchRepository,
} from '@imports/application/ports/import-batch.repository';
import { ImportBatch } from '@imports/domain/import-batch.entity';
import {
  TRANSACTION_REPOSITORY,
  TransactionRepository,
} from '@transactions/application/ports/transaction.repository';
import {
  Transaction,
  TransactionType,
} from '@transactions/domain/transaction.entity';
import { DomainError } from '@shared/domain/domain.error';

export interface ImportTransactionRow {
  amount: number;
  currency: string;
  type: 'income' | 'expense';
  description: string;
  date: Date;
  categoryIds: string[];
  contentHash: string;
}

export interface ImportTransactionsCommand {
  batchId: string;
  workspaceId: string;
  batchHash: string;
  sourceFilename?: string;
  rows: ImportTransactionRow[];
  isRetry?: boolean;
}

export interface ImportTransactionsResult {
  saved: number;
  duplicatesSkipped: number;
}

const ROW_TYPE_MAP: Record<ImportTransactionRow['type'], TransactionType> = {
  income: TransactionType.Income,
  expense: TransactionType.Expense,
};

@Injectable()
export class ImportTransactionsHandler {
  constructor(
    @Inject(IMPORT_BATCH_REPOSITORY)
    private readonly batchRepo: ImportBatchRepository,
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepo: TransactionRepository,
  ) {}

  async execute(
    command: ImportTransactionsCommand,
  ): Promise<ImportTransactionsResult> {
    const batch = await this.resolveOrCreateBatch(command);

    const { saved, duplicatesSkipped } = await this.saveNewTransactions(
      command.workspaceId,
      command.batchId,
      command.rows,
    );

    if (saved > 0) {
      await this.batchRepo.save(batch.recordSavedRows(saved));
    }

    return { saved, duplicatesSkipped };
  }

  private async resolveOrCreateBatch(
    command: ImportTransactionsCommand,
  ): Promise<ImportBatch> {
    const existing = await this.batchRepo.findById(command.batchId);

    if (existing) {
      this.assertOwnership(existing, command.workspaceId);
      return existing;
    }

    await this.assertNoDuplicateBatch(command);

    const batch = ImportBatch.create({
      id: command.batchId,
      workspaceId: command.workspaceId,
      batchHash: command.batchHash,
      sourceFilename: command.sourceFilename,
      totalRows: command.rows.length,
    });
    await this.batchRepo.save(batch);
    return batch;
  }

  private assertOwnership(batch: ImportBatch, workspaceId: string): void {
    if (batch.workspaceId !== workspaceId) {
      throw new DomainError('Batch does not belong to this workspace');
    }
  }

  private async assertNoDuplicateBatch(
    command: ImportTransactionsCommand,
  ): Promise<void> {
    const duplicate = await this.batchRepo.findByBatchHash(
      command.workspaceId,
      command.batchHash,
    );
    if (duplicate) {
      throw new BatchAlreadyImportedError(command.batchHash);
    }
  }

  private async saveNewTransactions(
    workspaceId: string,
    batchId: string,
    rows: ImportTransactionRow[],
  ): Promise<{ saved: number; duplicatesSkipped: number }> {
    let saved = 0;
    let duplicatesSkipped = 0;

    for (const row of rows) {
      const result = await this.processRow(workspaceId, batchId, row);
      if (result === 'saved') saved++;
      else duplicatesSkipped++;
    }

    return { saved, duplicatesSkipped };
  }

  private async processRow(
    workspaceId: string,
    batchId: string,
    row: ImportTransactionRow,
  ): Promise<'saved' | 'skipped'> {
    const isDuplicate = await this.transactionRepo.existsByContentHash(
      workspaceId,
      row.contentHash,
    );
    if (isDuplicate) {
      return 'skipped';
    }

    const transaction = Transaction.create({
      amount: row.amount,
      currency: row.currency,
      type: ROW_TYPE_MAP[row.type],
      categoryIds: row.categoryIds,
      description: row.description,
      date: row.date,
      contentHash: row.contentHash,
      importBatchId: batchId,
    });
    await this.transactionRepo.save(transaction);
    return 'saved';
  }
}

export class BatchAlreadyImportedError extends DomainError {
  constructor(batchHash: string) {
    super(`Batch with hash ${batchHash} was already imported`);
    this.name = 'BatchAlreadyImportedError';
  }
}
