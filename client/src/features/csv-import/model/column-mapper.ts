import type { ColumnMapping, CsvRow, DomainField, TransactionRow } from './types';

const HEADER_HEURISTICS: Record<string, DomainField> = {
  'data operacji': 'date',
  'data transakcji': 'date',
  'data księgowania': 'date',
  data: 'date',
  'opis operacji': 'title',
  'tytuł operacji': 'title',
  'tytuł': 'title',
  opis: 'title',
  kwota: 'amount',
  'kwota operacji': 'amount',
  'wartość': 'amount',
  waluta: 'currency',
  'saldo po operacji': 'balance',
  'saldo końcowe': 'balance',
  saldo: 'balance',
};

export const autoDetectMapping = (
  headers: readonly string[],
): ColumnMapping => {
  const mapping: ColumnMapping = {};
  const usedFields = new Set<DomainField>();

  for (const header of headers) {
    const normalized = header.toLowerCase().trim();
    const field = HEADER_HEURISTICS[normalized];
    if (field && !usedFields.has(field)) {
      mapping[header] = field;
      usedFields.add(field);
    }
  }
  return mapping;
};

const parseAmount = (value: string): number => {
  const cleaned = value.replace(/\s/g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

export const applyMapping = (
  rows: readonly CsvRow[],
  mapping: ColumnMapping,
): TransactionRow[] => {
  const fieldToColumn = Object.entries(mapping).reduce<Record<DomainField, string>>(
    (acc, [col, field]) => {
      if (field) acc[field] = col;
      return acc;
    },
    {} as Record<DomainField, string>,
  );

  return rows.map((row, i) => ({
    id: String(i),
    date: row[fieldToColumn.date] ?? '',
    title: row[fieldToColumn.title] ?? '',
    amount: parseAmount(row[fieldToColumn.amount] ?? '0'),
    currency: row[fieldToColumn.currency] ?? 'PLN',
    balance: fieldToColumn.balance ? parseAmount(row[fieldToColumn.balance] ?? '0') : undefined,
    status: 'ok' as const,
  }));
};
