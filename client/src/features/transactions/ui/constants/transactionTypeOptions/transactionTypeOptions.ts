export const TRANSACTION_TYPE_OPTIONS: readonly {
  readonly value: 'income' | 'expense';
  readonly labelKey: string;
}[] = [
  { value: 'expense', labelKey: 'transactions.form.typeExpense' },
  { value: 'income', labelKey: 'transactions.form.typeIncome' },
];
