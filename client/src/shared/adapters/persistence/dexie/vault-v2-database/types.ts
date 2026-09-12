export interface VaultV2RecordEnvelope {
  readonly id: string;
  readonly collection: string;
  readonly header: Record<string, unknown>;
  readonly ciphertext: string;
  readonly updatedAt: number;
}

export interface VaultV2RotationJournal {
  readonly recoveryBackupConfirmed?: true;
  readonly currentKeyId: string;
  readonly nextKeyId: string;
  readonly idempotencyKey: string;
  readonly envelopePurpose: 'device-wrap' | 'passkey-wrap';
  readonly envelope: string;
  readonly passkeyEnvelope?: string;
  readonly currentVmkEnvelope: {
    readonly header: Record<string, unknown>;
    readonly ciphertext: string;
  };
  readonly nextVmkEnvelope: {
    readonly header: Record<string, unknown>;
    readonly ciphertext: string;
  };
}

export interface VaultV2Metadata {
  readonly id: 'vault';
  readonly protocolVersion: 2;
  readonly accountId: string;
  readonly workspaceId: string;
  readonly vaultId: string;
  readonly keyId: string;
  readonly deviceId: string;
  readonly createdAt: number;
  readonly localShare?: CryptoKey;
  readonly signingKeyPair: CryptoKeyPair;
  readonly sentinel: {
    readonly header: Record<string, unknown>;
    readonly ciphertext: string;
  };
  readonly pendingRotation?: VaultV2RotationJournal;
  readonly requiresRemoteRestore?: boolean;
}
