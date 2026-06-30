import { detectAmountLocale, parseAmount } from './parser/amount-parser';
import { detectDateFormat, parseDate, parseDateFlexible } from './parser/date-parser';
import type {
  ColumnMapping,
  CsvRow,
  DomainField,
  RowStatus,
  TransactionRow,
} from './types';

const MIN_DATE_YEAR = 2000;
const MAX_DATE_YEAR = 2030;
const SAMPLE_SIZE = 10;

const isDateInRange = (isoDate: string): boolean => {
  const year = parseInt(isoDate.slice(0, 4), 10);
  return year >= MIN_DATE_YEAR && year <= MAX_DATE_YEAR;
};

/**
 * Transform raw CSV rows into typed TransactionRows using confirmed column mapping.
 * Accumulates errors/warnings per row instead of silently passing bad data.
 */
export const transformRows = (
  rows: readonly CsvRow[],
  mapping: ColumnMapping,
): TransactionRow[] => {
  const fieldToColumn = Object.entries(mapping).reduce<
    Partial<Record<DomainField, string>>
  >((acc, [col, field]) => {
    if (field) {
      acc[field] = col;
    }
    return acc;
  }, {});

  if (!fieldToColumn.date || !fieldToColumn.title || !fieldToColumn.amount) {
    throw new Error('Required fields (date, title, amount) must be mapped');
  }

  const dateCol = fieldToColumn.date;
  const titleCol = fieldToColumn.title;
  const amountCol = fieldToColumn.amount;
  const currencyCol = fieldToColumn.currency;
  const balanceCol = fieldToColumn.balance;

  // Auto-detect formats from sample data
  const dateSamples = rows.slice(0, SAMPLE_SIZE).map((r) => r[dateCol] ?? '');
  const amountSamples = rows
    .slice(0, SAMPLE_SIZE)
    .map((r) => r[amountCol] ?? '');
  const dateFormat = detectDateFormat(dateSamples);
  const amountLocale = detectAmountLocale(amountSamples);

  return rows.map((row) => {
    const reasons: string[] = [];
    let status: RowStatus = 'ok';

    // Parse amount
    const rawAmount = row[amountCol] ?? '';
    const amount = parseAmount(rawAmount, amountLocale);
    if (amount === null) {
      status = 'error';
      reasons.push('Invalid amount');
    }

    // Parse date
    const rawDate = row[dateCol] ?? '';
    const parsedDate = dateFormat
      ? parseDate(rawDate, dateFormat)
      : parseDateFlexible(rawDate);
    if (!parsedDate && rawDate) {
      if (status === 'ok') {
        status = 'warning';
      }
      reasons.push('Unparseable date');
    } else if (parsedDate && !isDateInRange(parsedDate)) {
      if (status === 'ok') {
        status = 'warning';
      }
      reasons.push('Date out of range');
    }

    // Validate title
    const title = row[titleCol]?.trim() ?? '';
    if (!title) {
      status = 'error';
      reasons.push('Empty title');
    }

    return {
      id: crypto.randomUUID(),
      date: parsedDate ?? rawDate,
      title,
      amount: amount ?? NaN,
      currency: currencyCol ? (row[currencyCol] ?? 'PLN') : 'PLN',
      balance: balanceCol
        ? (parseAmount(row[balanceCol] ?? '', amountLocale) ?? undefined)
        : undefined,
      status,
      statusReason: reasons.length > 0 ? reasons.join('; ') : undefined,
    };
  });
};
