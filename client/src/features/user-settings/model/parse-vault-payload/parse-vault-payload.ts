import {
  isVaultPayload,
  type DecryptedVaultPayload,
  type LegacyVaultPayload,
} from '#features/user-settings/model/vault-payload';
import { VaultPayloadError } from '#features/user-settings/model/vault-payload-error';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isValidVaultItem = (value: unknown): value is Record<string, unknown> =>
  isRecord(value) && 'id' in value && typeof value.id === 'string';

const parseLegacyCollection = (
  parsed: Record<string, unknown>,
  key: 'transactions' | 'rules',
): { readonly records: ReadonlyArray<Record<string, unknown>>; readonly hasInvalidRecords: boolean } => {
  const raw = parsed[key];
  if (raw === undefined) return { records: [], hasInvalidRecords: false };
  if (!Array.isArray(raw)) throw new VaultPayloadError(`Legacy vault section "${key}" is invalid`);
  return {
    records: raw.filter(isValidVaultItem),
    hasInvalidRecords: raw.some((item) => !isValidVaultItem(item)),
  };
};

const parseLegacyPayload = (parsed: Record<string, unknown>): LegacyVaultPayload => {
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
    hasInvalidRecords: transactions.hasInvalidRecords || rules.hasInvalidRecords,
  };
};

const parse = (plaintext: string): DecryptedVaultPayload => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(plaintext);
  } catch {
    throw new VaultPayloadError('Vault payload is not valid JSON');
  }
  if (!isRecord(parsed)) throw new VaultPayloadError('Vault payload is not an object');
  if (parsed.schemaVersion === undefined) return parseLegacyPayload(parsed);
  if (!isVaultPayload(parsed)) throw new VaultPayloadError('Vault payload has an invalid schema');
  return parsed;
};

export const parseVaultPayload = parse;
