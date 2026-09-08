import { decryptVault } from '#features/user-settings/model/decrypt-vault';
import { isRecord } from '#features/user-settings/model/decrypt-vault-payload/is-record';
import { isValidVaultItem } from '#features/user-settings/model/decrypt-vault-payload/is-valid-vault-item';
import {
  isVaultPayload,
  type DecryptedVaultPayload,
  type LegacyVaultPayload,
} from '#features/user-settings/model/vault-payload';
import { VaultPayloadError } from '#features/user-settings/model/vault-payload-error';

export const decryptVaultPayload = async (
  encryptedBlob: string,
  password: string,
): Promise<DecryptedVaultPayload> => {
  const plaintext = await decryptVault(encryptedBlob, password);

  return parseVaultPayload(plaintext);
};

export const parseVaultPayload = (plaintext: string): DecryptedVaultPayload => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(plaintext);
  } catch {
    throw new VaultPayloadError('Decrypted data is not valid JSON');
  }

  if (!isRecord(parsed)) {
    throw new VaultPayloadError('Decrypted payload is not an object');
  }

  if (parsed.schemaVersion === undefined) {
    return parseLegacyPayload(parsed);
  }

  if (!isVaultPayload(parsed)) {
    throw new VaultPayloadError('Decrypted payload has an invalid schema');
  }

  return parsed;
};

const parseLegacyPayload = (
  parsed: Record<string, unknown>,
): LegacyVaultPayload => {
  const transactions = parseLegacyCollection(parsed, 'transactions');
  const rules = parseLegacyCollection(parsed, 'rules');

  return {
    schemaVersion: 0,
    createdAt: '',
    transactions: transactions.records,
    rules: rules.records,
    categories: [],
    budgets: [],
    periodHistory: [],
    importHistory: [],
    hasInvalidRecords:
      transactions.hasInvalidRecords || rules.hasInvalidRecords,
  };
};

const parseLegacyCollection = (
  parsed: Record<string, unknown>,
  key: 'transactions' | 'rules',
): {
  readonly records: ReadonlyArray<Record<string, unknown>>;
  readonly hasInvalidRecords: boolean;
} => {
  const raw = parsed[key];
  if (raw === undefined) {
    return { records: [], hasInvalidRecords: false };
  }
  if (!Array.isArray(raw)) {
    throw new VaultPayloadError(`Legacy vault section "${key}" is invalid`);
  }

  // The unversioned reader preserves the historical format for migration.
  // Restore code still runs current domain validation before any write.
  return {
    records: raw.filter(isValidVaultItem),
    hasInvalidRecords: raw.some((item) => !isValidVaultItem(item)),
  };
};
