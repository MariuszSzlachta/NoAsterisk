import { productIdentity } from '#shared/config/product-identity/product-identity';

export const recoveryBackupFile = Object.freeze({
  filename: productIdentity.recoveryFilename,
  mimeType: 'text/plain;charset=utf-8',
});
