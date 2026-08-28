export interface ImportProgress {
  readonly totalChunks: number;
  readonly completedChunks: number;
  readonly totalRows: number;
  readonly savedRows: number;
  readonly duplicatesSkipped: number;
  readonly errors: ReadonlyArray<{
    readonly chunkIndex: number;
    readonly message: string;
  }>;
  readonly status: 'idle' | 'submitting' | 'completed' | 'failed';
}
