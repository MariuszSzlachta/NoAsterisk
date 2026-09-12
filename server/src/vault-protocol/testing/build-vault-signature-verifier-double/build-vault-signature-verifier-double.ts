import type { VaultSignatureVerifierPort } from '@vault-protocol/domain/ports/vault-signature-verifier';

export const buildVaultSignatureVerifierDouble =
  (): VaultSignatureVerifierPort => ({
    verifyDevice: async () => true,
    verifyRecovery: async () => true,
  });
