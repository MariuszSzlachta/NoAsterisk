export type VaultResult =
  | { status: 'empty' }
  | {
      status: 'available';
      encryptedBlob: string;
      byteSize: number;
      revision: number;
      contentHash: string;
      createdAt: string;
      updatedAt: string;
    };
