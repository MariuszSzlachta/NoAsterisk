export interface PersistenceSyncMetadata {
  readonly observedRevision: number | undefined;
  readonly lastSuccessfulSyncRevision: number | undefined;
  readonly lastSuccessfulSyncAt: string | undefined;
  readonly isDirty: boolean;
  readonly highWaterEnvelopeHash?: string;
}
