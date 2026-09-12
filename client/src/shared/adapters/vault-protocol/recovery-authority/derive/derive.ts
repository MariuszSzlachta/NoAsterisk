import { ed25519 } from '@noble/curves/ed25519.js';

import { recoveryAuthorityFormat } from '#shared/adapters/vault-protocol/recovery-authority/constants';

export const deriveRecoveryPublicKey = (
  recoverySeed: Uint8Array,
): Uint8Array<ArrayBuffer> => {
  if (recoverySeed.length !== recoveryAuthorityFormat.seedBytes)
    throw new Error('Invalid recovery authority');
  const ownedSeed = recoverySeed.slice();
  try {
    return Uint8Array.from(ed25519.getPublicKey(ownedSeed));
  } finally {
    ownedSeed.fill(0);
  }
};
