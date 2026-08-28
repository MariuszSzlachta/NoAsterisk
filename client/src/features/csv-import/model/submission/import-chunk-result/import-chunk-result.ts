export interface ImportChunkResult {
  readonly status: 'accepted' | 'partial' | 'rejected';
  readonly saved: number;
  readonly duplicatesSkipped: number;
  readonly rejected?: ReadonlyArray<{
    readonly rowIndex: number;
    readonly reason: string;
  }>;
}
