export interface ImportHistoryRecord {
  readonly batchId: string;
  readonly fileName: string;
  readonly completedAt: string;
  readonly acceptedCount: number;
  readonly duplicateCount: number;
  readonly rejectedCount: number;
}

export interface CreateImportHistoryRecordInput {
  readonly batchId: string;
  readonly fileName: string;
  readonly completedAt: string;
  readonly acceptedCount: number;
  readonly duplicateCount: number;
  readonly rejectedCount: number;
}
