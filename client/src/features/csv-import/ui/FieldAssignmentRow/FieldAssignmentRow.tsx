import { useTranslation } from 'react-i18next';

import { Badge } from '#shared/ui/Badge';
import { Select, type SelectOption } from '#shared/ui/Select';

import { useFieldAssignmentRow } from './useFieldAssignmentRow';

interface FieldAssignmentRowProps {
  readonly header: string;
  readonly exampleValue: string;
  readonly value: string;
  readonly options: readonly SelectOption[];
  readonly isMerged: boolean;
  readonly mergePartners: readonly string[];
  readonly onFieldChange: (column: string, value: string) => void;
}

export const FieldAssignmentRow = ({
  header,
  exampleValue,
  value,
  options,
  isMerged,
  mergePartners,
  onFieldChange,
}: FieldAssignmentRowProps): React.JSX.Element => {
  const { t } = useTranslation();
  const { handleChange } = useFieldAssignmentRow(header, onFieldChange);

  const isMapped = value !== '';

  return (
    <div
      className={`flex items-center gap-4 rounded-lg border border-border px-4 py-4 ${
        isMerged
          ? 'border-l-2 border-l-primary bg-surface-2'
          : isMapped
            ? 'border-l-2 border-l-income bg-surface-2'
            : 'bg-surface-2'
      }`}
    >
      {/* Column name */}
      <div className="w-44 shrink-0">
        <p className="font-mono text-[13px] font-medium text-foreground">
          {header}
        </p>
        <p className="text-[11px] text-subtle">
          {t('import.mapping.csvColumn')}
        </p>
      </div>

      {/* Example value */}
      <div className="min-w-0 flex-1">
        <p className="truncate font-mono text-[13px] text-muted-foreground">
          {exampleValue || '—'}
        </p>
        <p className="text-[11px] text-subtle">{t('import.mapping.example')}</p>
      </div>

      {/* Merge badge */}
      {isMerged && (
        <Badge variant="soft" color="primary" dot={false}>
          {t('import.mapping.merge.badge', { count: mergePartners.length + 1 })}
        </Badge>
      )}

      {/* Field select */}
      <div className="w-48 shrink-0">
        <Select
          options={options}
          value={value}
          onChange={handleChange}
          placeholder={t('import.mapping.skip')}
          showDot={value !== ''}
        />
      </div>
    </div>
  );
};
