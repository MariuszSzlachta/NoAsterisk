export interface StoredTransaction {
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

export interface CreateTransactionFormValues {
  readonly title: string;
  readonly amount: string;
  readonly date: string;
  readonly type: 'income' | 'expense';
  readonly categoryId: string;
}
