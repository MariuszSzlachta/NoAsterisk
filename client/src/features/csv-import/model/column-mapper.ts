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
  const fieldToColumn = Object.entries(mapping).reduce<Partial<Record<DomainField, string>>>(
    (acc, [col, field]) => {
      if (field) acc[field] = col;
      return acc;
    },
    {},
  );

  if (!fieldToColumn.date || !fieldToColumn.title || !fieldToColumn.amount) {
    throw new Error('Required fields (date, title, amount) must be mapped');
  }

  const dateCol = fieldToColumn.date;
  const titleCol = fieldToColumn.title;
  const amountCol = fieldToColumn.amount;
  const currencyCol = fieldToColumn.currency;
  const balanceCol = fieldToColumn.balance;

  // Auto-detect formats from sample data
  const dateSamples = rows.slice(0, 10).map((r) => r[dateCol] ?? '');
  const amountSamples = rows.slice(0, 10).map((r) => r[amountCol] ?? '');
  const dateFormat = detectDateFormat(dateSamples);
  const amountLocale = detectAmountLocale(amountSamples);

  return rows.map((row) => {
    const rawAmount = row[amountCol] ?? '';
    const amount = parseAmount(rawAmount, amountLocale);

    return {
      id: crypto.randomUUID(),
      date: dateFormat
        ? (parseDate(row[dateCol] ?? '', dateFormat) ?? row[dateCol] ?? '')
        : (row[dateCol] ?? ''),
      title: row[titleCol] ?? '',
      amount: amount ?? NaN,
      currency: currencyCol ? (row[currencyCol] ?? 'PLN') : 'PLN',
      balance: balanceCol
        ? (parseAmount(row[balanceCol] ?? '', amountLocale) ?? undefined)
        : undefined,
      status: amount === null ? 'error' as const : 'ok' as const,
      statusReason: amount === null ? 'Invalid amount' : undefined,
    };
  });
};
