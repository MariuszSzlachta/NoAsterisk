import type { ImportRowPayload } from '#features/csv-import/model/submission/import-row-payload';

export interface ImportChunkPayload {
  readonly batchId: string;
  readonly batchHash: string;
  readonly sourceFilename?: string;
  readonly profileId?: string;
  readonly rows: readonly ImportRowPayload[];
  readonly isRetry?: boolean;
}
