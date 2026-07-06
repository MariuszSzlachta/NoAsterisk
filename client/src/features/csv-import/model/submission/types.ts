// ═══════════════════════════════════════════════════════════════════
// Submission Types — Import Payload, Chunking, Progress
// ═══════════════════════════════════════════════════════════════════

export type TransactionType = 'income' | 'expense';

export interface ImportRowPayload {
  readonly amount: number;
  readonly currency: string;
  readonly type: TransactionType;
  readonly description: string;
  readonly date: string;
  readonly categoryIds: readonly string[];
  readonly contentHash: string;
}

export interface ImportChunkPayload {
  readonly batchId: string;
  readonly batchHash: string;
  readonly sourceFilename?: string;
  readonly profileId?: string;
  readonly rows: readonly ImportRowPayload[];
  readonly isRetry?: boolean;
}

export interface ImportChunkResult {
  readonly status: 'accepted' | 'partial' | 'rejected';
  readonly saved: number;
  readonly duplicatesSkipped: number;
  readonly rejected?: ReadonlyArray<{ readonly rowIndex: number; readonly reason: string }>;
}

export interface ImportProgress {
  readonly totalChunks: number;
  readonly completedChunks: number;
  readonly totalRows: number;
  readonly savedRows: number;
  readonly duplicatesSkipped: number;
  readonly errors: ReadonlyArray<{ readonly chunkIndex: number; readonly message: string }>;
  readonly status: 'idle' | 'submitting' | 'completed' | 'failed';
}
