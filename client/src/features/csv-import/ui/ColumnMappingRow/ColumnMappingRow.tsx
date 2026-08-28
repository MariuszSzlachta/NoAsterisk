import { useTranslation } from 'react-i18next';

import { Select } from '#shared/ui/Select';
import { FIELD_OPTIONS } from '#features/csv-import/ui/ColumnMappingRow/field-options';

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
