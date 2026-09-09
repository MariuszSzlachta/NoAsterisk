export type VaultResponse =
  | { readonly status: 'empty' }
  | {
      readonly status: 'available';
      readonly encryptedBlob: string;
      readonly byteSize: number;
      readonly revision: number;
      readonly contentHash: string;
      readonly createdAt: string;
      readonly updatedAt: string;
    };
