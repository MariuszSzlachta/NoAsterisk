import { DomainError } from '@shared/domain/domain.error';

export enum ImportBatchStatus {
  Pending = 'Pending',
  InProgress = 'InProgress',
  Complete = 'Complete',
  PartiallyRejected = 'PartiallyRejected',
}

export class ImportBatch {
  constructor(
    public readonly id: string,
    public readonly workspaceId: string,
    public readonly batchHash: string,
    public readonly sourceFilename: string | undefined,
    public readonly totalRows: number,
    public readonly savedRows: number,
    public readonly status: ImportBatchStatus,
    public readonly importedAt: Date,
    public readonly completedAt: Date | undefined,
  ) {
    if (!id) {
      throw new DomainError('ImportBatch ID cannot be empty');
    }
    if (!workspaceId) {
      throw new DomainError('ImportBatch workspaceId cannot be empty');
    }
    if (!batchHash) {
      throw new DomainError('ImportBatch batchHash cannot be empty');
    }
    if (totalRows < 0) {
      throw new DomainError('ImportBatch totalRows cannot be negative');
    }
    if (savedRows < 0) {
      throw new DomainError('ImportBatch savedRows cannot be negative');
    }
    if (savedRows > totalRows) {
      throw new DomainError('ImportBatch savedRows cannot exceed totalRows');
    }
  }

  static create(props: {
    id: string;
    workspaceId: string;
    batchHash: string;
    sourceFilename?: string;
    totalRows: number;
  }): ImportBatch {
    return new ImportBatch(
      props.id,
      props.workspaceId,
      props.batchHash,
      props.sourceFilename,
      props.totalRows,
      0,
      ImportBatchStatus.Pending,
      new Date(),
      undefined,
    );
  }

  recordSavedRows(count: number): ImportBatch {
    if (count <= 0) {
      throw new DomainError('Saved rows count must be positive');
    }
    const newSaved = this.savedRows + count;
    if (newSaved > this.totalRows) {
      throw new DomainError('Saved rows count would exceed totalRows');
    }
    const isComplete = newSaved === this.totalRows;
    return new ImportBatch(
      this.id,
      this.workspaceId,
      this.batchHash,
      this.sourceFilename,
      this.totalRows,
      newSaved,
      isComplete ? ImportBatchStatus.Complete : ImportBatchStatus.InProgress,
      this.importedAt,
      isComplete ? new Date() : undefined,
    );
  }

  markPartiallyRejected(): ImportBatch {
    if (this.status !== ImportBatchStatus.InProgress) {
      throw new DomainError(
        'Can only mark InProgress batch as partially rejected',
      );
    }
    return new ImportBatch(
      this.id,
      this.workspaceId,
      this.batchHash,
      this.sourceFilename,
      this.totalRows,
      this.savedRows,
      ImportBatchStatus.PartiallyRejected,
      this.importedAt,
      new Date(),
    );
  }

  isComplete(): boolean {
    return this.status === ImportBatchStatus.Complete;
  }

  isDuplicate(otherBatchHash: string): boolean {
    return this.batchHash === otherBatchHash;
  }
}
