import { parseAmount } from '#features/csv-import/model/parsing/amount-parser/parse-amount';
import type { CsvRow } from '#features/csv-import/model/parsing/types/csv-row';

import { ZERO_AMOUNT_VALUES } from '#features/csv-import/model/transformation/row-transformer/constants/zero-amount-values';

export const resolveAmount = (
  row: CsvRow,
  amountCol: string | undefined,
  debitCol: string | undefined,
  creditCol: string | undefined,
  locale: 'pl' | 'en',
): number | null => {
  if (amountCol) {
    const rawAmount = row[amountCol] ?? '';
    return parseAmount(rawAmount, locale);
  }

  if (!debitCol && !creditCol) {
    return null;
  }

  const rawCredit = creditCol ? (row[creditCol] ?? '').trim() : '';
  const rawDebit = debitCol ? (row[debitCol] ?? '').trim() : '';

  if (rawCredit && !ZERO_AMOUNT_VALUES.has(rawCredit)) {
    const creditAmount = parseAmount(rawCredit, locale);
    if (creditAmount === null) {
      return null;
    }
    return Math.abs(creditAmount);
  }

  if (rawDebit && !ZERO_AMOUNT_VALUES.has(rawDebit)) {
    const debitAmount = parseAmount(rawDebit, locale);
    if (debitAmount === null) {
      return null;
    }
    return -Math.abs(debitAmount);
  }

  return null;
};
