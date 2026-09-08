import type {
  VaultPayload,
  VaultRecords,
} from '#features/user-settings/model/vault-payload';

type SortableVaultRecord =
  | { readonly id: string }
  | { readonly batchId: string };

const getRecordKey = (record: SortableVaultRecord): string =>
  'id' in record ? record.id : record.batchId;

const sortRecords = <TRecord extends SortableVaultRecord>(
  records: ReadonlyArray<TRecord>,
): ReadonlyArray<TRecord> =>
  [...records].sort((left, right) => {
    const leftKey = getRecordKey(left);
    const rightKey = getRecordKey(right);
    return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0;
  });

const canonicalizeValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(canonicalizeValue);
  }
  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
        .map(([key, nested]) => [key, canonicalizeValue(nested)]),
    );
  }
  return value;
};

const canonicalizeRecords = (records: VaultRecords): string =>
  JSON.stringify(
    canonicalizeValue({
      transactions: sortRecords(records.transactions),
      rules: sortRecords(records.rules),
      categories: sortRecords(records.categories),
      budgets: sortRecords(records.budgets),
      periodHistory: sortRecords(records.periodHistory),
      importHistory: sortRecords(records.importHistory),
    }),
  );

export const serializeVaultPayload = (payload: VaultPayload): string =>
  JSON.stringify(
    canonicalizeValue({
      schemaVersion: payload.schemaVersion,
      createdAt: payload.createdAt,
      transactions: sortRecords(payload.transactions),
      rules: sortRecords(payload.rules),
      categories: sortRecords(payload.categories),
      budgets: sortRecords(payload.budgets),
      periodHistory: sortRecords(payload.periodHistory),
      importHistory: sortRecords(payload.importHistory),
    }),
  );

export const canonicalizeVaultRecords = canonicalizeRecords;

export const digestVaultRecords = async (
  records: VaultRecords,
): Promise<string> => {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(canonicalizeRecords(records)),
  );
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
};
