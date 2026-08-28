export interface SplitState {
  readonly fields: readonly string[];
  readonly current: string;
  readonly inQuotes: boolean;
}
