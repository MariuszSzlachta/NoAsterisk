import type { SelectOption } from '#shared/ui/Select';

export const FIELD_OPTIONS = (t: (key: string) => string): SelectOption[] => [
  { value: '', label: t('import.mapping.skip') },
  { value: 'date', label: t('import.mapping.fields.date') },
  { value: 'title', label: t('import.mapping.fields.title') },
  { value: 'amount', label: t('import.mapping.fields.amount') },
  { value: 'currency', label: t('import.mapping.fields.currency') },
  { value: 'balance', label: t('import.mapping.fields.balance') },
  { value: 'debit', label: t('import.mapping.fields.debit') },
  { value: 'credit', label: t('import.mapping.fields.credit') },
];
