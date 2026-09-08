import type {
  DecryptedVaultPayload,
  LegacyRestorableVaultPayload,
  RestorableVaultPayload,
  VaultRuleRecord,
  VaultTransactionRecord,
} from '#features/user-settings/model/vault-payload';
import {
  isStrictRule,
  isStrictTransaction,
  isVaultPayload,
} from '#features/user-settings/model/vault-payload/is-vault-payload';

export interface VaultRestorePlan {
  readonly payload: RestorableVaultPayload;
}

const hasUniqueValidRecords = <TRecord extends object>(
  records: ReadonlyArray<unknown>,
  validator: (value: unknown) => value is TRecord,
  getKey: (record: TRecord) => string,
): records is ReadonlyArray<TRecord> => {
  const keys = new Set<string>();
  return records.every((record) => {
    if (!validator(record)) {
      return false;
    }

    const key = getKey(record);
    if (key.length === 0 || keys.has(key)) {
      return false;
    }

    keys.add(key);
    return true;
  });
};

const createLegacyRestorePlan = (
  payload: DecryptedVaultPayload,
): VaultRestorePlan | undefined => {
  if (payload.schemaVersion !== 0 || payload.hasInvalidRecords === true) {
    return undefined;
  }

  if (
    !hasUniqueValidRecords(
      payload.transactions,
      isStrictTransaction,
      (record) => record.id,
    ) ||
    !hasUniqueValidRecords(payload.rules, isStrictRule, (record) => record.id)
  ) {
    return undefined;
  }

  const restorablePayload: LegacyRestorableVaultPayload = {
    schemaVersion: 0,
    transactions: payload.transactions,
    rules: payload.rules,
  };

  return { payload: restorablePayload };
};

export const createVaultRestorePlan = (
  payload: DecryptedVaultPayload,
): VaultRestorePlan | undefined => {
  if (payload.schemaVersion === 1) {
    return isVaultPayload(payload) ? { payload } : undefined;
  }

  return createLegacyRestorePlan(payload);
};

export type { VaultRuleRecord, VaultTransactionRecord };
