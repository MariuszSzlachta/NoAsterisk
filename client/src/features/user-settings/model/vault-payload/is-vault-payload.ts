import {
  VAULT_SCHEMA_VERSION,
  type VaultBudgetPeriod,
  type VaultBudgetRecord,
  type VaultCategoryRecord,
  type VaultImportHistoryRecord,
  type VaultPayload,
  type VaultPeriodHistoryRecord,
  type VaultRolloverRecord,
  type VaultRuleRecord,
  type VaultTransactionRecord,
} from '#features/user-settings/model/vault-payload';
import { isRecord } from '#shared/lib/is-record';
import { recordGuards } from '#shared/lib/record-guards';

const hasOnlyKeys = (value: object, keys: ReadonlyArray<string>): boolean =>
  Object.keys(value).every((key) => keys.includes(key));

const isValidDateString = (value: unknown): value is string =>
  typeof value === 'string' &&
  value.length > 0 &&
  Number.isFinite(Date.parse(value));

const isNonNegativeInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0;

const isStrictTransaction = (value: unknown): value is VaultTransactionRecord =>
  isRecord(value) &&
  recordGuards.hasString(value, 'id') &&
  isValidDateString(value.date) &&
  recordGuards.hasString(value, 'description') &&
  recordGuards.hasFiniteNumber(value, 'amount') &&
  recordGuards.hasString(value, 'currency') &&
  recordGuards.hasString(value, 'contentHash') &&
  recordGuards.hasString(value, 'batchId') &&
  isValidDateString(value.importedAt) &&
  recordGuards.isOptionalString(value, 'categoryId') &&
  recordGuards.isOptionalString(value, 'accountName') &&
  recordGuards.isOptionalString(value, 'budgetId') &&
  hasOnlyKeys(value, [
    'id',
    'date',
    'description',
    'amount',
    'currency',
    'categoryId',
    'accountName',
    'contentHash',
    'batchId',
    'importedAt',
    'budgetId',
  ]);

const isStrictRule = (value: unknown): value is VaultRuleRecord =>
  isRecord(value) &&
  recordGuards.hasString(value, 'id') &&
  recordGuards.hasString(value, 'keyword') &&
  (value.matcherType === 'Contains' || value.matcherType === 'Exact') &&
  recordGuards.hasString(value, 'categoryId') &&
  recordGuards.hasFiniteNumber(value, 'priority') &&
  isValidDateString(value.createdAt) &&
  hasOnlyKeys(value, [
    'id',
    'keyword',
    'matcherType',
    'categoryId',
    'priority',
    'createdAt',
  ]);

const isStrictCategory = (value: unknown): value is VaultCategoryRecord =>
  isRecord(value) &&
  recordGuards.hasString(value, 'id') &&
  recordGuards.hasString(value, 'label') &&
  recordGuards.hasString(value, 'color') &&
  hasOnlyKeys(value, ['id', 'label', 'color']);

const isStrictBudgetPeriod = (value: unknown): value is VaultBudgetPeriod => {
  if (!isRecord(value)) {
    return false;
  }
  if (value.type === 'custom') {
    return (
      recordGuards.hasString(value, 'dateFrom') &&
      recordGuards.hasString(value, 'dateTo') &&
      isValidDateString(value.dateFrom) &&
      isValidDateString(value.dateTo) &&
      hasOnlyKeys(value, ['type', 'dateFrom', 'dateTo'])
    );
  }
  return (
    (value.type === 'monthly' || value.type === 'yearly') &&
    hasOnlyKeys(value, ['type'])
  );
};

const isStrictBudget = (value: unknown): value is VaultBudgetRecord =>
  isRecord(value) &&
  recordGuards.hasString(value, 'id') &&
  recordGuards.hasString(value, 'workspaceId') &&
  recordGuards.hasString(value, 'name') &&
  recordGuards.hasString(value, 'color') &&
  recordGuards.hasFiniteNumber(value, 'limitAmount') &&
  recordGuards.hasString(value, 'limitCurrency') &&
  Array.isArray(value.categoryIds) &&
  value.categoryIds.every((id) => typeof id === 'string') &&
  isValidDateString(value.createdAt) &&
  typeof value.isArchived === 'boolean' &&
  ((value.budgetType === 'savings' && value.period === null) ||
    (value.budgetType === 'standard' && isStrictBudgetPeriod(value.period))) &&
  hasOnlyKeys(value, [
    'id',
    'workspaceId',
    'name',
    'color',
    'limitAmount',
    'limitCurrency',
    'categoryIds',
    'createdAt',
    'isArchived',
    'budgetType',
    'period',
  ]);

const isStrictRollover = (
  value: unknown,
): value is VaultRolloverRecord | null =>
  value === null ||
  (isRecord(value) &&
    recordGuards.hasFiniteNumber(value, 'amount') &&
    (value.targetType === 'same_budget' ||
      value.targetType === 'savings_budget') &&
    recordGuards.hasString(value, 'targetBudgetId') &&
    hasOnlyKeys(value, ['amount', 'targetType', 'targetBudgetId']));

const isStrictPeriodHistory = (
  value: unknown,
): value is VaultPeriodHistoryRecord =>
  isRecord(value) &&
  recordGuards.hasString(value, 'id') &&
  recordGuards.hasString(value, 'budgetId') &&
  isValidDateString(value.periodFrom) &&
  isValidDateString(value.periodTo) &&
  recordGuards.hasFiniteNumber(value, 'limitAmount') &&
  recordGuards.hasFiniteNumber(value, 'spentAmount') &&
  recordGuards.hasFiniteNumber(value, 'remainingAmount') &&
  isValidDateString(value.closedAt) &&
  isStrictRollover(value.rollover) &&
  hasOnlyKeys(value, [
    'id',
    'budgetId',
    'periodFrom',
    'periodTo',
    'limitAmount',
    'spentAmount',
    'remainingAmount',
    'closedAt',
    'rollover',
  ]);

const isStrictImportHistory = (
  value: unknown,
): value is VaultImportHistoryRecord =>
  isRecord(value) &&
  recordGuards.hasString(value, 'batchId') &&
  typeof value.batchId === 'string' &&
  value.batchId.trim().length > 0 &&
  recordGuards.hasString(value, 'fileName') &&
  typeof value.fileName === 'string' &&
  value.fileName.trim().length > 0 &&
  isValidDateString(value.completedAt) &&
  isNonNegativeInteger(value.acceptedCount) &&
  isNonNegativeInteger(value.duplicateCount) &&
  isNonNegativeInteger(value.rejectedCount) &&
  hasOnlyKeys(value, [
    'batchId',
    'fileName',
    'completedAt',
    'acceptedCount',
    'duplicateCount',
    'rejectedCount',
  ]);

const isUniqueValidArray = <TRecord extends object>(
  value: unknown,
  validator: (item: unknown) => item is TRecord,
  getKey: (item: TRecord) => string,
): value is ReadonlyArray<TRecord> => {
  if (!Array.isArray(value)) {
    return false;
  }
  const keys = new Set<string>();
  return value.every((item) => {
    if (!validator(item)) {
      return false;
    }
    const key = getKey(item);
    if (key.length === 0 || keys.has(key)) {
      return false;
    }
    keys.add(key);
    return true;
  });
};

export const isVaultPayload = (value: unknown): value is VaultPayload => {
  if (
    !isRecord(value) ||
    value.schemaVersion !== VAULT_SCHEMA_VERSION ||
    !isValidDateString(value.createdAt)
  ) {
    return false;
  }

  const allowedKeys = [
    'schemaVersion',
    'createdAt',
    'transactions',
    'rules',
    'categories',
    'budgets',
    'periodHistory',
    'importHistory',
  ];
  if (!hasOnlyKeys(value, allowedKeys)) {
    return false;
  }

  return (
    isUniqueValidArray(
      value.transactions,
      isStrictTransaction,
      (item) => item.id,
    ) &&
    isUniqueValidArray(value.rules, isStrictRule, (item) => item.id) &&
    isUniqueValidArray(value.categories, isStrictCategory, (item) => item.id) &&
    isUniqueValidArray(value.budgets, isStrictBudget, (item) => item.id) &&
    isUniqueValidArray(
      value.periodHistory,
      isStrictPeriodHistory,
      (item) => item.id,
    ) &&
    isUniqueValidArray(
      value.importHistory,
      isStrictImportHistory,
      (item) => item.batchId,
    )
  );
};

export {
  isStrictBudget,
  isStrictCategory,
  isStrictImportHistory,
  isStrictPeriodHistory,
  isStrictRule,
  isStrictTransaction,
};
