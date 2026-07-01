import { useTranslation } from 'react-i18next';

import { Button } from '#shared/ui/Button';
import { Card } from '#shared/ui/Card';

import { ColumnMappingRow } from '#features/csv-import/ui/ColumnMappingRow';
import { useColumnMappingStep } from '#features/csv-import/ui/hooks/useColumnMappingStep';

export const ColumnMappingStep = (): React.JSX.Element => {
  const { t } = useTranslation();
  const {
    headers,
    columnMapping,
    isMappingComplete,
    handleFieldChange,
    handleConfirm,
  } = useColumnMappingStep();

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-6">
        <h3 className="mb-4 text-sm font-medium text-foreground">
          {t('import.mapping.title')}
        </h3>
        <p className="mb-6 text-xs text-muted-foreground">
          {t('import.mapping.description')}
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {headers.map((header) => (
            <ColumnMappingRow
              key={header}
              header={header}
              value={columnMapping[header] ?? ''}
              onFieldChange={handleFieldChange}
            />
          ))}
        </div>
      </Card>
      <div className="flex justify-end">
        <Button onClick={handleConfirm} disabled={!isMappingComplete}>
          {t('import.mapping.confirm')}
        </Button>
      </div>
    </div>
  );
};
