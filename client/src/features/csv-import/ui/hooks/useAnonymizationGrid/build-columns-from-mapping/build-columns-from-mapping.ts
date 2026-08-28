import type { ColumnMapping, DomainField } from '#features/csv-import/model/types';
import type { GridColumn } from '#shared/adapters/grid';
import type { AnonymizationGridRow } from '#features/csv-import/ui/hooks/useAnonymizationGrid/types';
import type { CellRendererMap } from '#features/csv-import/ui/hooks/useAnonymizationGrid/cell-renderer-map';
import { DOMAIN_FIELD_TO_GRID_FIELD } from '#features/csv-import/ui/hooks/useAnonymizationGrid/domain-field-to-grid-field';
import { DOMAIN_FIELD_HEADER_I18N } from '#features/csv-import/ui/hooks/useAnonymizationGrid/domain-field-header-i18n';
import { COLUMN_WIDTHS } from '#features/csv-import/ui/hooks/useAnonymizationGrid/column-widths';
import { COLUMN_MIN_WIDTHS } from '#features/csv-import/ui/hooks/useAnonymizationGrid/column-min-widths';

export const buildColumnsFromMapping = (
  columnMapping: ColumnMapping,
  t: (key: string) => string,
  cellRenderers?: CellRendererMap,
): GridColumn<AnonymizationGridRow>[] =>
  Object.values(columnMapping)
    .filter((field): field is DomainField => field !== undefined)
    .filter((field, idx, arr) => arr.indexOf(field) === idx)
    .reduce<GridColumn<AnonymizationGridRow>[]>((cols, field) => {
      const gridField = DOMAIN_FIELD_TO_GRID_FIELD[field];
      if (!gridField) {
        return cols;
      }
      return [
        ...cols,
        {
          field: gridField,
          headerName: t(DOMAIN_FIELD_HEADER_I18N[field]),
          sortable: true,
          ...(COLUMN_WIDTHS[field]
            ? { width: COLUMN_WIDTHS[field] }
            : { flex: 1 }),
          ...(COLUMN_MIN_WIDTHS[field]
            ? { minWidth: COLUMN_MIN_WIDTHS[field] }
            : {}),
          ...(cellRenderers?.[field]
            ? { cellRenderer: cellRenderers[field] }
            : {}),
        },
      ];
    }, []);
