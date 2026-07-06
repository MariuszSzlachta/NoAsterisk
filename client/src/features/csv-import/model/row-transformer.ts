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
const ZERO_AMOUNT_VALUES: ReadonlySet<string> = new Set(['0', '0,00', '0.00']);

const isDateInRange = (isoDate: string): boolean => {
  const year = parseInt(isoDate.slice(0, 4), 10);
  return year >= MIN_DATE_YEAR && year <= MAX_DATE_YEAR;
};

/**
 * Resolve amount from mapping. Handles two cases:
 * 1. Single 'amount' column → parse directly
 * 2. Debit/credit split ('debit' + 'credit' columns) → merge into signed amount
 *    - Debit (Wn) = expenses (negative)
 *    - Credit (Ma) = income (positive)
 */
const resolveAmount = (
  row: CsvRow,
  amountCol: string | undefined,
  debitCol: string | undefined,
  creditCol: string | undefined,
  locale: 'pl' | 'en',
): number | null => {
  // Case 1: Single amount column
  if (amountCol) {
    const rawAmount = row[amountCol] ?? '';
    return parseAmount(rawAmount, locale);
  }

  // Case 2: Debit/credit split
  if (debitCol || creditCol) {
    const rawDebit = debitCol ? (row[debitCol] ?? '').trim() : '';
    const rawCredit = creditCol ? (row[creditCol] ?? '').trim() : '';

    // One of them should be filled per row
    if (rawCredit && !ZERO_AMOUNT_VALUES.has(rawCredit)) {
      const creditAmount = parseAmount(rawCredit, locale);
      return creditAmount !== null ? Math.abs(creditAmount) : null;
    }
    if (rawDebit && !ZERO_AMOUNT_VALUES.has(rawDebit)) {
      const debitAmount = parseAmount(rawDebit, locale);
      return debitAmount !== null ? -Math.abs(debitAmount) : null;
    }

    // Both empty
    return null;
  }

  return null;
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

  const hasAmountSource =
    fieldToColumn.amount || fieldToColumn.debit || fieldToColumn.credit;
  if (!fieldToColumn.date || !fieldToColumn.title || !hasAmountSource) {
    throw new Error(
      'Required fields (date, title, amount or debit/credit) must be mapped',
    );
  }

  const dateCol = fieldToColumn.date;
  const titleCol = fieldToColumn.title;
  const amountCol = fieldToColumn.amount;
  const debitCol = fieldToColumn.debit;
  const creditCol = fieldToColumn.credit;
  const currencyCol = fieldToColumn.currency;
  const balanceCol = fieldToColumn.balance;
  const categoryCol = fieldToColumn.category;

  // Auto-detect formats from sample data
  const dateSamples = rows.slice(0, SAMPLE_SIZE).map((r) => r[dateCol] ?? '');

  // For amount locale detection — hasAmountSource is guaranteed truthy after guard
  const amountSampleCol = hasAmountSource;
  const amountSamples = rows
    .slice(0, SAMPLE_SIZE)
    .map((r) => r[amountSampleCol] ?? '');
  const dateFormat = detectDateFormat(dateSamples);
  const amountLocale = detectAmountLocale(amountSamples);

  return rows.map((row) => {
    const reasons: string[] = [];
    let status: RowStatus = 'ok';

    // Parse amount (single column or debit/credit merge)
    const amount = resolveAmount(row, amountCol, debitCol, creditCol, amountLocale);
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
      category: categoryCol ? (row[categoryCol]?.trim() || undefined) : undefined,
      status,
      statusReason: reasons.length > 0 ? reasons.join('; ') : undefined,
    };
  });
};
