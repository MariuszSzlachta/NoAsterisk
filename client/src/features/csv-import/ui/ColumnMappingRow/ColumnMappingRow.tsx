import { useTranslation } from 'react-i18next';

import { Select, type SelectOption } from '#shared/ui/Select';

interface ColumnMappingRowProps {
  readonly header: string;
  readonly value: string;
  readonly onFieldChange: (column: string, value: string) => void;
}

export const ColumnMappingRow = ({
  header,
  value,
  onFieldChange,
}: ColumnMappingRowProps): React.JSX.Element => {
  const { t } = useTranslation();

  const handleChange = (newValue: string): void => {
    onFieldChange(header, newValue);
  };

  return (
    <div className="flex items-center gap-3">
      <span className="w-40 truncate text-xs font-mono text-muted-foreground">
        {header}
      </span>
      <Select
        options={FIELD_OPTIONS(t)}
        value={value}
        onChange={handleChange}
        placeholder={t('import.mapping.skip')}
        className="flex-1"
      />
    </div>
  );
};

// useColumnMappingStep. Brakuje category/source/recipient/counterpart/reference,
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
