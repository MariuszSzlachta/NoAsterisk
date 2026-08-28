import { decryptVault } from '#features/user-settings/model/decrypt-vault';
import { VaultDecryptionError } from '#features/user-settings/model/vault-decryption-error';
import type { VaultPayload } from '#features/user-settings/model/vault-payload';

import { isRecord } from '#features/user-settings/model/decrypt-vault-payload/is-record';
import { isValidVaultItem } from '#features/user-settings/model/decrypt-vault-payload/is-valid-vault-item';

export const decryptVaultPayload = async (
  encryptedBlob: string,
  password: string,
): Promise<VaultPayload> => {
  const plaintext = await decryptVault(encryptedBlob, password);

  let parsed: unknown;
  try {
    parsed = JSON.parse(plaintext);
  } catch {
    throw new VaultDecryptionError('Decrypted data is not valid JSON');
  }

  if (!isRecord(parsed)) {
    throw new VaultDecryptionError('Decrypted payload is not an object');
  }

  const rawTransactions: readonly unknown[] = Array.isArray(parsed['transactions']) ? parsed['transactions'] : [];
  const rawRules: readonly unknown[] = Array.isArray(parsed['rules']) ? parsed['rules'] : [];

  const transactions = rawTransactions.filter(isValidVaultItem);
  const rules = rawRules.filter(isValidVaultItem);

  return { transactions, rules };
};
