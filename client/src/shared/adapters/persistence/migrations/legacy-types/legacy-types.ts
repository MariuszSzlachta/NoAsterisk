import type { RuleRecord } from '#features/admin-rules/model/rule-record';
import type { BudgetRecord } from '#features/budgets/model/types/budget-record';
import type { PeriodHistoryRecord } from '#features/budgets/model/types/period-history-record';
import type { StoredTransaction } from '#features/transactions/model/types';
import type { CategoryInfo } from '#model/category/types';
import type {
  EncryptedRecordEnvelope,
  ImportProfileRecord,
  PersistenceCollection,
} from '#shared/adapters/persistence/ports';

type LegacyRecord =
  | BudgetRecord
  | CategoryInfo
  | ImportProfileRecord
  | PeriodHistoryRecord
  | RuleRecord
  | StoredTransaction;

interface LegacySource<TRecord extends object = LegacyRecord> {
  readonly key: string;
  readonly collection: Exclude<PersistenceCollection, 'sentinel'>;
  readonly stateField: string;
  readonly validator: (value: unknown) => value is TRecord;
}

interface ValidatedLegacySource<TRecord extends object = LegacyRecord> {
  readonly source: LegacySource<TRecord>;
  readonly records: ReadonlyArray<TRecord>;
}

interface EncryptedLegacySource<TRecord extends object = LegacyRecord> {
  readonly source: LegacySource<TRecord>;
  readonly envelopes: ReadonlyArray<EncryptedRecordEnvelope>;
}

interface LegacyMigrationResult {
  readonly status: 'complete' | 'skipped' | 'invalid';
  readonly warning?: string;
}

export {
  type EncryptedLegacySource,
  type LegacyRecord,
  type LegacyMigrationResult,
  type LegacySource,
  type ValidatedLegacySource,
};
