export interface PendingBatchEdit {
  readonly editedRowId: string;
  readonly field: 'title' | 'category';
  readonly originalValue: string;
  readonly newValue: string;
  readonly similarRowIds: ReadonlyArray<string>;
}
