import type { ColumnMapping, CsvRow, DomainField, TransactionRow } from './types';

import { detectAmountLocale, parseAmount } from './parser/amount-parser';
import { detectDateFormat, parseDate } from './parser/date-parser';

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

  // Auto-detect formats from sample data
  const dateSamples = rows.slice(0, 10).map((r) => r[fieldToColumn.date] ?? '');
  const amountSamples = rows.slice(0, 10).map((r) => r[fieldToColumn.amount] ?? '');
  const dateFormat = detectDateFormat(dateSamples);
  const amountLocale = detectAmountLocale(amountSamples);

  return rows.map((row, i) => ({
    id: String(i),
    date: dateFormat
      ? (parseDate(row[fieldToColumn.date] ?? '', dateFormat) ?? row[fieldToColumn.date] ?? '')
      : (row[fieldToColumn.date] ?? ''),
    title: row[fieldToColumn.title] ?? '',
    amount: parseAmount(row[fieldToColumn.amount] ?? '0', amountLocale),
    currency: row[fieldToColumn.currency] ?? 'PLN',
    balance: fieldToColumn.balance
      ? parseAmount(row[fieldToColumn.balance] ?? '0', amountLocale)
      : undefined,
    status: 'ok' as const,
  }));
};
