import type { ColumnMapping } from '#features/csv-import/model/column-mapping/column-mapping-type';
import { detectAmountLocale } from '#features/csv-import/model/parsing/amount-parser/detect-amount-locale';
import { parseAmount } from '#features/csv-import/model/parsing/amount-parser/parse-amount';
import { detectDateFormat } from '#features/csv-import/model/parsing/date-parser/detect-date-format';
import { parseDate } from '#features/csv-import/model/parsing/date-parser/parse-date';
import { parseDateFlexible } from '#features/csv-import/model/parsing/date-parser/parse-date-flexible';
import type { CsvRow } from '#features/csv-import/model/parsing/types/csv-row';
import { buildFieldToColumns } from '#features/csv-import/model/transformation/row-transformer/build-field-to-columns';
import { DEFAULT_CURRENCY } from '#features/csv-import/model/transformation/row-transformer/constants/default-currency';
import { ERROR_MESSAGE_DATE_OUT_OF_RANGE } from '#features/csv-import/model/transformation/row-transformer/constants/error-message-date-out-of-range';
import { ERROR_MESSAGE_EMPTY_TITLE } from '#features/csv-import/model/transformation/row-transformer/constants/error-message-empty-title';
import { ERROR_MESSAGE_INVALID_AMOUNT } from '#features/csv-import/model/transformation/row-transformer/constants/error-message-invalid-amount';
import { ERROR_MESSAGE_REQUIRED_FIELDS } from '#features/csv-import/model/transformation/row-transformer/constants/error-message-required-fields';
import { ERROR_MESSAGE_UNPARSEABLE_DATE } from '#features/csv-import/model/transformation/row-transformer/constants/error-message-unparseable-date';
import { SAMPLE_SIZE } from '#features/csv-import/model/transformation/row-transformer/constants/sample-size';
import { STATUS_REASON_SEPARATOR } from '#features/csv-import/model/transformation/row-transformer/constants/status-reason-separator';
import { firstCol } from '#features/csv-import/model/transformation/row-transformer/first-col';
import { isDateInRange } from '#features/csv-import/model/transformation/row-transformer/is-date-in-range';
import { mergeColumns } from '#features/csv-import/model/transformation/row-transformer/merge-columns';
import { resolveAmount } from '#features/csv-import/model/transformation/row-transformer/resolve-amount';
import type { RowStatus } from '#features/csv-import/model/transformation/types/row-status';
import type { TransactionRow } from '#features/csv-import/model/transformation/types/transaction-row';

export const transformRows = (
  rows: readonly CsvRow[],
  mapping: ColumnMapping,
): TransactionRow[] => {
  const fieldToColumns = buildFieldToColumns(mapping);

  const dateCols = fieldToColumns.date;
  const titleCols = fieldToColumns.title;
  const amountCol = firstCol(fieldToColumns, 'amount');
  const debitCol = firstCol(fieldToColumns, 'debit');
  const creditCol = firstCol(fieldToColumns, 'credit');
  const hasAmountSource = amountCol || debitCol || creditCol;

  if (!dateCols?.length || !titleCols?.length || !hasAmountSource) {
    throw new Error(ERROR_MESSAGE_REQUIRED_FIELDS);
  }

  const dateCol = dateCols[0];
  const currencyCol = firstCol(fieldToColumns, 'currency');
  const balanceCol = firstCol(fieldToColumns, 'balance');
  const categoryCol = firstCol(fieldToColumns, 'category');
  const sourceCols = fieldToColumns.source;
  const recipientCols = fieldToColumns.recipient;
  const counterpartCols = fieldToColumns.counterpart;
  const referenceCol = firstCol(fieldToColumns, 'reference');

  const dateSamples = rows.slice(0, SAMPLE_SIZE).map((r) => r[dateCol] ?? '');
  const amountSampleCol = hasAmountSource;
  const amountSamples = rows
    .slice(0, SAMPLE_SIZE)
    .map((r) => r[amountSampleCol] ?? '');
  const dateFormat = detectDateFormat(dateSamples);
  const amountLocale = detectAmountLocale(amountSamples);

  return rows.map((row) => {
    const reasons: string[] = [];
    let status: RowStatus = 'ok';

    const amount = resolveAmount(row, amountCol, debitCol, creditCol, amountLocale);
    if (amount === null) {
      status = 'error';
      reasons.push(ERROR_MESSAGE_INVALID_AMOUNT);
    }

    const rawDate = row[dateCol] ?? '';
    const parsedDate = dateFormat
      ? parseDate(rawDate, dateFormat)
      : parseDateFlexible(rawDate);

    if (!parsedDate && rawDate) {
      if (status === 'ok') {
        status = 'warning';
      }
      reasons.push(ERROR_MESSAGE_UNPARSEABLE_DATE);
    }
    if (parsedDate && !isDateInRange(parsedDate)) {
      if (status === 'ok') {
        status = 'warning';
      }
      reasons.push(ERROR_MESSAGE_DATE_OUT_OF_RANGE);
    }

    const title = mergeColumns(row, titleCols);
    if (!title) {
      status = 'error';
      reasons.push(ERROR_MESSAGE_EMPTY_TITLE);
    }

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
      currency: currencyCol ? (row[currencyCol] ?? DEFAULT_CURRENCY) : DEFAULT_CURRENCY,
      balance: balanceCol
        ? (parseAmount(row[balanceCol] ?? '', amountLocale) ?? undefined)
        : undefined,
      category: categoryCol ? row[categoryCol]?.trim() || undefined : undefined,
      source,
      recipient,
      counterpart,
      reference,
      status,
      statusReason: reasons.length > 0 ? reasons.join(STATUS_REASON_SEPARATOR) : undefined,
    };
  });
};
