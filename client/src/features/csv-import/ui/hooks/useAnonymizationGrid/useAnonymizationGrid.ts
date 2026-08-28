import { useMemo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';

import type {
  AnonymizationEntry,
  AnonymizationStatus,
  ColumnMapping,
  DomainField,
  TransactionRow,
} from '#features/csv-import/model/types';
import { useImportWizardStore } from '#features/csv-import/store/useImportWizardStore';
import type { CellRendererParams, GridColumn } from '#shared/adapters/grid';

import type { StatusFilter } from '#features/csv-import/ui/hooks/useAnonymizationStep';

import type { AnonymizationGridRow } from './types';

// ─── Types ───────────────────────────────────────────────────────

interface AnonymizationGridResult {
  readonly columns: GridColumn<AnonymizationGridRow>[];
  readonly rows: AnonymizationGridRow[];
  readonly getRowId: (row: AnonymizationGridRow) => string;
  readonly getRowClass: (row: AnonymizationGridRow) => string | undefined;
}

// ─── Constants ───────────────────────────────────────────────────

export const DOMAIN_FIELD_TO_GRID_FIELD: Partial<
  Record<DomainField, keyof AnonymizationGridRow>
> = {
  date: 'date',
  title: 'title',
  amount: 'amount',
  currency: 'currency',
  balance: 'balance',
  category: 'category',
};

export const DOMAIN_FIELD_HEADER_I18N: Record<DomainField, string> = {
  date: 'import.grid.date',
  title: 'import.grid.title',
  amount: 'import.grid.amount',
  currency: 'import.grid.currency',
  balance: 'import.grid.balance',
  category: 'import.grid.category',
  debit: 'import.grid.debit',
  credit: 'import.grid.credit',
  source: 'import.grid.source',
  recipient: 'import.grid.recipient',
  reference: 'import.grid.reference',
  counterpart: 'import.grid.counterpart',
};

export const COLUMN_WIDTHS: Partial<Record<DomainField, number>> = {
  date: 100,
  amount: 120,
  currency: 80,
  balance: 120,
  category: 140,
};

export const COLUMN_MIN_WIDTHS: Partial<Record<DomainField, number>> = {
  title: 400,
};

// ─── Helpers ─────────────────────────────────────────────────────

export type CellRendererMap = Partial<
  Record<
    DomainField,
    (params: CellRendererParams<AnonymizationGridRow>) => ReactNode
  >
>;

export const buildColumnsFromMapping = (
  columnMapping: ColumnMapping,
  t: (key: string) => string,
  cellRenderers?: CellRendererMap,
): GridColumn<AnonymizationGridRow>[] => {
  const seenFields = new Set<DomainField>();
  const columns: GridColumn<AnonymizationGridRow>[] = [];

  for (const [, domainField] of Object.entries(columnMapping)) {
    if (!domainField || seenFields.has(domainField)) {
      continue;
    }
    seenFields.add(domainField);

    const gridField = DOMAIN_FIELD_TO_GRID_FIELD[domainField];
    if (!gridField) {
      continue;
    }

    const column: GridColumn<AnonymizationGridRow> = {
      field: gridField,
      headerName: t(DOMAIN_FIELD_HEADER_I18N[domainField]),
      sortable: true,
      ...(COLUMN_WIDTHS[domainField]
        ? { width: COLUMN_WIDTHS[domainField] }
        : { flex: 1 }),
      ...(COLUMN_MIN_WIDTHS[domainField]
        ? { minWidth: COLUMN_MIN_WIDTHS[domainField] }
        : {}),
      ...(cellRenderers?.[domainField]
        ? { cellRenderer: cellRenderers[domainField] }
        : {}),
    };

    columns.push(column);
  }

  return columns;
};

export const buildGridRows = (
  rows: readonly Pick<
    TransactionRow,
    'id' | 'date' | 'title' | 'amount' | 'currency' | 'balance' | 'category'
  >[],
  entries: readonly AnonymizationEntry[],
): AnonymizationGridRow[] =>
  rows.map((row, idx) => {
    const entry = entries[idx];
    return {
      id: row.id,
      date: row.date,
      title: entry ? entry.anonymizedTitle : row.title,
      amount: row.amount,
      currency: row.currency,
      balance: row.balance,
      category: row.category,
      anonymizationStatus: entry ? entry.status : 'safe',
      rowIndex: idx,
    };
  });

export const getRowId = (row: AnonymizationGridRow): string => row.id;

export const ROW_STATUS_CLASSES: Record<AnonymizationStatus, string> = {
  safe: 'anonymization-row-safe',
  needs_review: 'anonymization-row-needs-review',
  anonymized: 'anonymization-row-anonymized',
};

export const getRowClass = (row: AnonymizationGridRow): string | undefined =>
  ROW_STATUS_CLASSES[row.anonymizationStatus];

// ─── Hook ────────────────────────────────────────────────────────

export const useAnonymizationGrid = (
  cellRenderers?: CellRendererMap,
  statusFilter?: StatusFilter,
): AnonymizationGridResult => {
  const { t } = useTranslation();

  const { columnMapping, rows, entries } = useImportWizardStore(
    useShallow((s) => ({
      columnMapping: s.columnMapping,
      rows: s.rows,
      entries: s.anonymizationEntries,
    })),
  );

  // Columns only change when mapping changes (rare after step 1)
  const columns = useMemo(
    () => buildColumnsFromMapping(columnMapping, t, cellRenderers),
    [columnMapping, t, cellRenderers],
  );

  // Grid rows join TransactionRow + AnonymizationEntry by positional index
  // INVARIANT: rows and entries arrays maintain same positional mapping (see bullet 1 comment)
  const gridRows = useMemo(() => {
    const allRows = buildGridRows(rows, entries);
    if (!statusFilter || statusFilter === 'all') {
      return allRows;
    }
    return allRows.filter((r) => r.anonymizationStatus === statusFilter);
  }, [rows, entries, statusFilter]);

  return {
    columns,
    rows: gridRows,
    getRowId,
    getRowClass,
  };
};
