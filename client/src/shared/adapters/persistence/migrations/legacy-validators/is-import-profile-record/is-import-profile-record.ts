import type { ImportProfileRecord } from '#shared/adapters/persistence/ports';
import { isRecord } from '#shared/lib/is-record';
import { recordGuards } from '#shared/lib/record-guards';

export const isImportProfileRecord = (value: unknown): value is ImportProfileRecord =>
  isRecord(value) &&
  recordGuards.hasString(value, 'id') &&
  recordGuards.hasString(value, 'name') &&
  recordGuards.isStringMap(value.columnMapping) &&
  recordGuards.hasString(value, 'createdAt');
