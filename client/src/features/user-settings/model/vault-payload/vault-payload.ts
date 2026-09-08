export const VAULT_SCHEMA_VERSION = 1;

export type VaultMatcherType = 'Contains' | 'Exact';

export interface VaultTransactionRecord {
  readonly id: string;
  readonly date: string;
  readonly description: string;
  readonly amount: number;
  readonly currency: string;
  readonly categoryId?: string;
  readonly accountName?: string;
  readonly contentHash: string;
  readonly batchId: string;
  readonly importedAt: string;
  readonly budgetId?: string;
}

export interface VaultRuleRecord {
  readonly id: string;
  readonly keyword: string;
  readonly matcherType: VaultMatcherType;
  readonly categoryId: string;
  readonly priority: number;
  readonly createdAt: string;
}

export interface VaultCategoryRecord {
  readonly id: string;
  readonly label: string;
  readonly color: string;
}

export type VaultBudgetPeriod =
  | { readonly type: 'monthly' }
  | { readonly type: 'yearly' }
  | {
      readonly type: 'custom';
      readonly dateFrom: string;
      readonly dateTo: string;
    };

export interface VaultBudgetRecordBase {
  readonly id: string;
  readonly workspaceId: string;
  readonly name: string;
  readonly color: string;
  readonly limitAmount: number;
  readonly limitCurrency: string;
  readonly categoryIds: ReadonlyArray<string>;
  readonly createdAt: string;
  readonly isArchived: boolean;
}

export type VaultBudgetRecord =
  | (VaultBudgetRecordBase & {
      readonly budgetType: 'standard';
      readonly period: VaultBudgetPeriod;
    })
  | (VaultBudgetRecordBase & {
      readonly budgetType: 'savings';
      readonly period: null;
    });

export type VaultRolloverRecord = {
  readonly amount: number;
  readonly targetType: 'same_budget' | 'savings_budget';
  readonly targetBudgetId: string;
};

export interface VaultPeriodHistoryRecord {
  readonly id: string;
  readonly budgetId: string;
  readonly periodFrom: string;
  readonly periodTo: string;
  readonly limitAmount: number;
  readonly spentAmount: number;
  readonly remainingAmount: number;
  readonly closedAt: string;
  readonly rollover: VaultRolloverRecord | null;
}

export interface VaultImportHistoryRecord {
  readonly batchId: string;
  readonly fileName: string;
  readonly completedAt: string;
  readonly acceptedCount: number;
  readonly duplicateCount: number;
  readonly rejectedCount: number;
}

export interface VaultRecords {
  readonly transactions: ReadonlyArray<VaultTransactionRecord>;
  readonly rules: ReadonlyArray<VaultRuleRecord>;
  readonly categories: ReadonlyArray<VaultCategoryRecord>;
  readonly budgets: ReadonlyArray<VaultBudgetRecord>;
  readonly periodHistory: ReadonlyArray<VaultPeriodHistoryRecord>;
  readonly importHistory: ReadonlyArray<VaultImportHistoryRecord>;
}

export interface VaultPayload extends VaultRecords {
  readonly schemaVersion: typeof VAULT_SCHEMA_VERSION;
  readonly createdAt: string;
}

/**
 * The old vault format had no envelope and only two collections. It is
 * intentionally kept separate from the restorable v1 shape: old records are
 * read for compatibility but must still pass the current domain validators
 * before they can be written to encrypted storage.
 */
export interface LegacyVaultPayload {
  readonly schemaVersion: 0;
  readonly createdAt: '';
  readonly transactions: ReadonlyArray<Record<string, unknown>>;
  readonly rules: ReadonlyArray<Record<string, unknown>>;
  readonly categories: readonly [];
  readonly budgets: readonly [];
  readonly periodHistory: readonly [];
  readonly importHistory: readonly [];
  readonly hasInvalidRecords?: boolean;
}

export interface LegacyRestorableVaultPayload {
  readonly schemaVersion: 0;
  readonly transactions: ReadonlyArray<VaultTransactionRecord>;
  readonly rules: ReadonlyArray<VaultRuleRecord>;
}

export type DecryptedVaultPayload = VaultPayload | LegacyVaultPayload;
export type RestorableVaultPayload =
  | VaultPayload
  | LegacyRestorableVaultPayload;
