export interface ImportBatchResponseDto {
  id: string;
  batchHash: string;
  sourceFilename?: string;
  totalRows: number;
  savedRows: number;
  status: 'Pending' | 'InProgress' | 'Complete' | 'PartiallyRejected';
  importedAt: string;
  completedAt?: string;
}
