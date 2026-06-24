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
import {
  IMPORT_PROFILE_REPOSITORY,
  ImportProfileRepository,
} from '@import-profiles/application/ports/import-profile.repository';
import { DomainError } from '@shared/domain/domain.error';
import { PiiValidationService } from '@imports/application/services/pii-validation.service';
import { FieldToValidate } from '@imports/application/ports/pii-rule.port';
import { AutoCategorizeHandler } from '@categorization-rules/application/commands/auto-categorize.handler';

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
  profileId?: string;
  rows: ImportTransactionRow[];
  isRetry?: boolean;
}

export interface RejectedRow {
  rowIndex: number;
  field: string;
  reason: string;
}

export interface ImportTransactionsResult {
  saved: number;
  duplicatesSkipped: number;
  rejected: RejectedRow[];
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
    @Inject(IMPORT_PROFILE_REPOSITORY)
    private readonly profileRepo: ImportProfileRepository,
    private readonly piiService: PiiValidationService,
    private readonly autoCategorize: AutoCategorizeHandler,
  ) {}

  async execute(
    command: ImportTransactionsCommand,
  ): Promise<ImportTransactionsResult> {
    if (command.profileId) {
      const profile = await this.profileRepo.findById(
        command.workspaceId,
        command.profileId,
      );
      if (!profile) {
        throw new DomainError(
          `Import profile '${command.profileId}' not found`,
        );
      }
    }

    const batch = await this.resolveOrCreateBatch(command);

    const { clean, rejected } = this.partitionByPii(command.rows);

    const { saved, duplicatesSkipped } =
      clean.length > 0
        ? await this.saveNewTransactions(
            command.workspaceId,
            command.batchId,
            clean,
          )
        : { saved: 0, duplicatesSkipped: 0 };

    if (saved > 0) {
      await this.batchRepo.save(batch.recordSavedRows(saved));
      await this.autoCategorize.execute({
        workspaceId: command.workspaceId,
        batchId: command.batchId,
      });
    }

    return { saved, duplicatesSkipped, rejected };
  }

  private partitionByPii(rows: ImportTransactionRow[]): {
    clean: ImportTransactionRow[];
    rejected: RejectedRow[];
  } {
    const fields: FieldToValidate[] = rows.map((row, index) => ({
      value: row.description,
      field: 'description',
      rowIndex: index,
    }));

    const violations = this.piiService.validate(fields);
    const rejectedIndices = new Set(violations.map((v) => v.rowIndex));

    return {
      clean: rows.filter((_, i) => !rejectedIndices.has(i)),
      rejected: violations.map((v) => ({
        rowIndex: v.rowIndex,
        field: v.field,
        reason: v.type,
      })),
    };
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
      workspaceId,
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
  constructor(_batchHash: string) {
    super('Batch was already imported');
    this.name = 'BatchAlreadyImportedError';
  }
}
