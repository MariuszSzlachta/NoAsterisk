import { CURRENCY_SUFFIX_PATTERN } from '#features/csv-import/model/parsing/shared/patterns/currency-suffix.pattern';
import { EN_THOUSANDS_PATTERN } from '#features/csv-import/model/parsing/shared/patterns/en-thousands.pattern';
import { PL_THOUSANDS_PATTERN } from '#features/csv-import/model/parsing/shared/patterns/pl-thousands.pattern';
import { normalizeWhitespace } from '#features/csv-import/model/parsing/shared/text-normalizers/normalize-whitespace';
import type { AmountLocale } from '#features/csv-import/model/parsing/types/amount-locale';

export const parseAmount = (
  value: string,
  locale: AmountLocale,
): number | null => {
  const initial = normalizeWhitespace(value);
  if (initial === '') {
    return null;
  }

  const afterQuote = initial.startsWith("'") ? initial.slice(1) : initial;

  const isParenNegative =
    afterQuote.startsWith('(') && afterQuote.endsWith(')');
  const afterParen = isParenNegative
    ? afterQuote.slice(1, -1).trim()
    : afterQuote;

  const afterPlus = afterParen.startsWith('+')
    ? afterParen.slice(1).trim()
    : afterParen;

  const isMinusNegative = afterPlus.startsWith('-');
  const afterMinus = isMinusNegative ? afterPlus.slice(1).trim() : afterPlus;

  const isNegative = isParenNegative || isMinusNegative;

  const afterCurrency = afterMinus.replace(CURRENCY_SUFFIX_PATTERN, '').trim();

  const normalized =
    locale === 'pl'
      ? afterCurrency.replace(PL_THOUSANDS_PATTERN, '').replace(',', '.')
      : afterCurrency.replace(EN_THOUSANDS_PATTERN, '');

  const num = parseFloat(normalized);
  if (isNaN(num)) {
    return null;
  }

  return isNegative ? -Math.abs(num) : num;
};
