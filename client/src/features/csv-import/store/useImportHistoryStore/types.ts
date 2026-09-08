import type { ImportHistoryRecord } from '#features/csv-import/model/history/types';

export interface ImportHistoryStoreState {
  readonly history: ReadonlyArray<ImportHistoryRecord>;
  readonly setHistory: (history: ReadonlyArray<ImportHistoryRecord>) => void;
  readonly addRecord: (record: ImportHistoryRecord) => void;
  readonly removeRecord: (batchId: string) => void;
}
