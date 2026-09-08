import {
  VAULT_SCHEMA_VERSION,
  type VaultPayload,
  type VaultRecords,
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

export const createVaultPayload = (
  records: VaultRecords,
  createdAt: string = new Date().toISOString(),
): VaultPayload => ({
  schemaVersion: VAULT_SCHEMA_VERSION,
  createdAt,
  transactions: sortRecords(records.transactions),
  rules: sortRecords(records.rules),
  categories: sortRecords(records.categories),
  budgets: sortRecords(records.budgets),
  periodHistory: sortRecords(records.periodHistory),
  importHistory: sortRecords(records.importHistory),
});
