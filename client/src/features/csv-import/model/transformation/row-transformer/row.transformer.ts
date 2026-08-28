import {
  MERGEABLE_FIELDS,
  type ColumnMapping,
  type DomainField,
} from '#features/csv-import/model/column-mapping/types';
import { detectAmountLocale, parseAmount } from '#features/csv-import/model/parsing/amount-parser';
import {
  detectDateFormat,
  parseDate,
  parseDateFlexible,
} from '#features/csv-import/model/parsing/date-parser';
import type { CsvRow } from '#features/csv-import/model/parsing/types';
import type { RowStatus, TransactionRow } from '#features/csv-import/model/transformation/types';

export const MIN_DATE_YEAR = 2000;
export const MAX_DATE_YEAR = 2030;
export const SAMPLE_SIZE = 10;
export const MERGE_SEPARATOR = ' ';
export const ZERO_AMOUNT_VALUES: ReadonlySet<string> = new Set(['0', '0,00', '0.00']);

export const isDateInRange = (isoDate: string): boolean => {
  const year = parseInt(isoDate.slice(0, 4), 10);
  return year >= MIN_DATE_YEAR && year <= MAX_DATE_YEAR;
};

/**
 * Merge multiple column values into a single string.
 * Trims each value, filters blanks, joins with separator.
 */
export const mergeColumns = (row: CsvRow, columns: readonly string[]): string =>
  columns
    .map((col) => (row[col] ?? '').trim())
    .filter(Boolean)
    .join(MERGE_SEPARATOR);

/**
 * Build a mapping from DomainField → array of CSV column names.
 * For MERGEABLE_FIELDS, multiple columns accumulate in order.
 * For non-mergeable fields, only the first mapped column is kept.
 */
export const buildFieldToColumns = (
  mapping: ColumnMapping,
): Partial<Record<DomainField, readonly string[]>> => {
  const result: Partial<Record<DomainField, string[]>> = {};

  for (const [col, field] of Object.entries(mapping)) {
    if (!field) {
      continue;
    }

    if (!result[field]) {
      result[field] = [];
    }

    if (MERGEABLE_FIELDS.has(field)) {
      result[field].push(col);
    } else if (result[field].length === 0) {
      result[field].push(col);
    }
    // Non-mergeable with >1 mapping: silently keep first
  }

  return result;
};

/**
 * Resolve amount from mapping. Handles two cases:
 * 1. Single 'amount' column → parse directly
 * 2. Debit/credit split ('debit' + 'credit' columns) → merge into signed amount
 *    - Debit (Wn) = expenses (negative)
 *    - Credit (Ma) = income (positive)
 */
export const resolveAmount = (
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
 * Supports multi-column merge for MERGEABLE_FIELDS (title, source, recipient).
 * Accumulates errors/warnings per row instead of silently passing bad data.
 */
export const transformRows = (
  rows: readonly CsvRow[],
  mapping: ColumnMapping,
): TransactionRow[] => {
  const fieldToColumns = buildFieldToColumns(mapping);

  const firstCol = (field: DomainField): string | undefined =>
    fieldToColumns[field]?.[0];

  const dateCols = fieldToColumns.date;
  const titleCols = fieldToColumns.title;
  const hasAmountSource =
    firstCol('amount') || firstCol('debit') || firstCol('credit');

  if (!dateCols?.length || !titleCols?.length || !hasAmountSource) {
    throw new Error(
      'Required fields (date, title, amount or debit/credit) must be mapped',
    );
  }

  const dateCol = dateCols[0];
  const amountCol = firstCol('amount');
  const debitCol = firstCol('debit');
  const creditCol = firstCol('credit');
  const currencyCol = firstCol('currency');
  const balanceCol = firstCol('balance');
  const categoryCol = firstCol('category');
  const sourceCols = fieldToColumns.source;
  const recipientCols = fieldToColumns.recipient;
  const counterpartCols = fieldToColumns.counterpart;
  const referenceCol = firstCol('reference');

  // Auto-detect formats from sample data
  // guarda, a `row[dateCol]` nie przechodzi strict build. Model mappingu nie
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
    const amount = resolveAmount(
      row,
      amountCol,
      debitCol,
      creditCol,
      amountLocale,
    );
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

    // Merge title columns
    const title = mergeColumns(row, titleCols);
    if (!title) {
      status = 'error';
      reasons.push('Empty title');
    }

    // Merge optional fields
    const source = sourceCols
      ? mergeColumns(row, sourceCols) || undefined
      : undefined;
    const recipient = recipientCols
      ? mergeColumns(row, recipientCols) || undefined
      : undefined;
    const counterpart = counterpartCols
      ? mergeColumns(row, counterpartCols) || undefined
      : undefined;
    const reference = referenceCol
      ? row[referenceCol]?.trim() || undefined
      : undefined;

    return {
      id: crypto.randomUUID(),
      date: parsedDate ?? rawDate,
      title,
      amount: amount ?? NaN,
      currency: currencyCol ? (row[currencyCol] ?? 'PLN') : 'PLN',
      balance: balanceCol
        ? (parseAmount(row[balanceCol] ?? '', amountLocale) ?? undefined)
        : undefined,
      category: categoryCol ? row[categoryCol]?.trim() || undefined : undefined,
      source,
      recipient,
      counterpart,
      reference,
      status,
      statusReason: reasons.length > 0 ? reasons.join('; ') : undefined,
    };
  });
};
