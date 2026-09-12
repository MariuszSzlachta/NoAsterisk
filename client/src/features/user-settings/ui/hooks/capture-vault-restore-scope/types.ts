export interface VaultRestoreScope {
  readonly generation: number;
  readonly mutationVersion: number;
  readonly assertCurrent: () => void;
}

export interface VaultRestoreAcknowledgement {
  readonly revision: number;
  readonly createdAt: string;
  readonly envelopeHash: string;
}
