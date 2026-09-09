export const getVaultByteSize = (encryptedBlob: string): number =>
  Buffer.byteLength(encryptedBlob, 'utf8');
