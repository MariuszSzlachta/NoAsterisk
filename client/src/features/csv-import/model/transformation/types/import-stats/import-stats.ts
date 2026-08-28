export interface ImportStats {
  readonly totalRows: number;
  readonly newTransactions: number;
  readonly duplicatesSkipped: number;
  readonly errorsSkipped: number;
  readonly dateRange: { readonly from: string; readonly to: string };
  readonly detectedBank?: string;
}
