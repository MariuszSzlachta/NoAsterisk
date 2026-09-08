import type { StoredTransaction } from '#features/transactions/model/types';
import { recordGuards } from '#shared/lib/record-guards';
import { isRecord } from '#shared/lib/is-record';

export const isStoredTransaction = (value: unknown): value is StoredTransaction =>
  isRecord(value) &&
  recordGuards.hasString(value, 'id') &&
  recordGuards.hasString(value, 'date') &&
  recordGuards.hasString(value, 'description') &&
  recordGuards.hasFiniteNumber(value, 'amount') &&
  recordGuards.hasString(value, 'currency') &&
  recordGuards.hasString(value, 'contentHash') &&
  recordGuards.hasString(value, 'batchId') &&
  recordGuards.hasString(value, 'importedAt') &&
  recordGuards.isOptionalString(value, 'categoryId') &&
  recordGuards.isOptionalString(value, 'accountName') &&
  recordGuards.isOptionalString(value, 'budgetId');
