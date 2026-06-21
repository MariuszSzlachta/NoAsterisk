import { Injectable, Inject } from '@nestjs/common';
import {
  IMPORT_BATCH_REPOSITORY,
  ImportBatchRepository,
} from '@imports/application/ports/import-batch.repository';
import {
  TRANSACTION_REPOSITORY,
  TransactionRepository,
} from '@transactions/application/ports/transaction.repository';

export interface DeleteImportBatchCommand {
  workspaceId: string;
  id: string;
}

@Injectable()
export class DeleteImportBatchHandler {
  constructor(
    @Inject(IMPORT_BATCH_REPOSITORY)
    private readonly batchRepo: ImportBatchRepository,
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepo: TransactionRepository,
  ) {}

  async execute(command: DeleteImportBatchCommand): Promise<boolean> {
    const batch = await this.batchRepo.findById(command.id);

    if (!batch || batch.workspaceId !== command.workspaceId) {
      return false;
    }

    await this.transactionRepo.deleteByBatchId(command.workspaceId, command.id);
    await this.batchRepo.delete(command.id);
    return true;
  }
}
