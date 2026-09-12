import { ed25519 } from '@noble/curves/ed25519.js';

import { recoveryAuthorityFormat } from '#shared/adapters/vault-protocol/recovery-authority/constants';

export const signRecoveryMessage = (
  recoverySeed: Uint8Array,
  message: Uint8Array,
): Uint8Array<ArrayBuffer> => {
  if (
    recoverySeed.length !== recoveryAuthorityFormat.seedBytes ||
    message.length > recoveryAuthorityFormat.maxMessageBytes
  )
    throw new Error('Invalid recovery authority');
  const ownedSeed = recoverySeed.slice();
  const ownedMessage = message.slice();
  try {
    return Uint8Array.from(ed25519.sign(ownedMessage, ownedSeed));
  } finally {
    ownedSeed.fill(0);
    ownedMessage.fill(0);
  }
};
