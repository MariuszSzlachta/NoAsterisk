export interface RotationContext {
  readonly accountId: string;
  readonly workspaceId: string;
  readonly vaultId: string;
  readonly keyId: string;
}

export interface RotationRecordContext extends RotationContext {
  readonly collection: string;
  readonly recordId: string;
}
