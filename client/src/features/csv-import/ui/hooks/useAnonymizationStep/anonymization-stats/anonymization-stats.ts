export interface AnonymizationStats {
  readonly totalScanned: number;
  readonly anonymizedCount: number;
  readonly needsReviewCount: number;
  readonly safeCount: number;
}
