import type { AmountLocale } from '../types';
import { NBSP } from '../shared/constants';

const CURRENCY_SUFFIX = /\s*(PLN|EUR|USD|GBP|CHF|CZK)\s*$/i;

const normalizeWhitespace = (value: string): string =>
  value.replace(new RegExp(NBSP, 'g'), ' ').trim();

/**
 * Handles NBSP thousands separator, parentheses-negative, leading +/−,
 * Polish/English formats, leading single-quote, currency suffixes.
 */
export const parseAmount = (value: string, locale: AmountLocale): number | null => {
  const initial = normalizeWhitespace(value);
  if (initial === '') return null;

  const afterQuote = initial.startsWith("'") ? initial.slice(1) : initial;

  const isParenNegative = afterQuote.startsWith('(') && afterQuote.endsWith(')');
  const afterParen = isParenNegative ? afterQuote.slice(1, -1).trim() : afterQuote;

  const afterPlus = afterParen.startsWith('+') ? afterParen.slice(1).trim() : afterParen;

  const isMinusNegative = afterPlus.startsWith('-');
  const afterMinus = isMinusNegative ? afterPlus.slice(1).trim() : afterPlus;

  const isNegative = isParenNegative || isMinusNegative;

  const afterCurrency = afterMinus.replace(CURRENCY_SUFFIX, '').trim();

  const normalized = locale === 'pl'
    ? afterCurrency.replace(/[\s.]/g, '').replace(',', '.')
    : afterCurrency.replace(/[,\s]/g, '');

  const num = parseFloat(normalized);
  if (isNaN(num)) return null;

  return isNegative ? -Math.abs(num) : num;
};
