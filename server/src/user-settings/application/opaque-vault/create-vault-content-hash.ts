import { createHash } from 'node:crypto';

export const createVaultContentHash = (encryptedBlob: string): string =>
  createHash('sha256').update(encryptedBlob, 'utf8').digest('hex');
