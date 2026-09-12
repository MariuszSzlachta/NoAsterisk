import { ed25519 } from '@noble/curves/ed25519.js';

import { recoveryAuthorityFormat } from '#shared/adapters/vault-protocol/recovery-authority/constants';

export const verifyRecoveryMessage = (
  publicKey: Uint8Array,
  message: Uint8Array,
  signature: Uint8Array,
): boolean => {
  if (
    publicKey.length !== recoveryAuthorityFormat.publicKeyBytes ||
    signature.length !== recoveryAuthorityFormat.signatureBytes ||
    message.length > recoveryAuthorityFormat.maxMessageBytes
  )
    return false;
  try {
    // RFC-8032 verification, not permissive ZIP-215 acceptance.
    return ed25519.verify(signature, message, publicKey, { zip215: false });
  } catch {
    return false;
  }
};
