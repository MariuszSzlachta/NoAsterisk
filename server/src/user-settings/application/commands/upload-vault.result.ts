export interface UploadVaultResult {
  encryptedBlob: string;
  byteSize: number;
  revision: number;
  contentHash: string;
  createdAt: string;
  updatedAt: string;
}
