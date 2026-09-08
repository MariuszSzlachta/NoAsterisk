// ═══════════════════════════════════════════════════════════════════
// Transactions Feature — Create Transaction Validation
// ═══════════════════════════════════════════════════════════════════

import type { CreateTransactionErrors, CreateTransactionFormValues } from './types';

// ─── Constants ───────────────────────────────────────────────────

const TITLE_MAX_LENGTH = 200;
const MAX_DECIMAL_PLACES = 2;
const MAX_AMOUNT = 99_999_999.99;

// ─── Helpers ─────────────────────────────────────────────────────

const validateTitle = (title: string): string | undefined => {
  const trimmed = title.trim();
  if (!trimmed) {
    return 'Tytuł jest wymagany';
  }
  if (trimmed.length > TITLE_MAX_LENGTH) {
    return `Maksymalnie ${TITLE_MAX_LENGTH} znaków`;
  }
  return undefined;
};

/**
 * Amount input is expected as dot-decimal (e.g. "87.50").
 * The HTML input type=number always uses dot as decimal separator
 * regardless of locale, so comma normalization is not needed here.
 */
const validateAmount = (amount: string): string | undefined => {
  const trimmed = amount.trim();
  if (!trimmed) {
    return 'Kwota jest wymagana';
  }
  const parsed = Number(trimmed);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return 'Kwota musi być liczbą większą od 0';
  }
  if (parsed > MAX_AMOUNT) {
    return 'Kwota jest zbyt duża';
  }
  const decimalParts = trimmed.split('.');
  const decimalPart = decimalParts[1];
  if (decimalPart !== undefined && decimalPart.length > MAX_DECIMAL_PLACES) {
    return 'Maksymalnie 2 miejsca po przecinku';
  }
  return undefined;
};

/**
 * Compares date values in ISO string format (YYYY-MM-DD) to avoid timezone issues.
 * Date-only strings parsed by `new Date()` are interpreted at UTC midnight,
 * which can differ from local "today". String comparison is timezone-safe.
 */
const validateDate = (date: string): string | undefined => {
  if (!date) {
    return 'Data jest wymagana';
  }
  const dateObj = new Date(date);
  if (Number.isNaN(dateObj.getTime())) {
    return 'Nieprawidłowa data';
  }
  const todayStr = new Date().toISOString().slice(0, 10);
  if (date > todayStr) {
    return 'Data nie może być z przyszłości';
  }
  return undefined;
};

const validateType = (type: string): string | undefined => {
  if (type !== 'income' && type !== 'expense') {
    return 'Wybierz typ transakcji';
  }
  return undefined;
};

// ─── Validation ──────────────────────────────────────────────────

/**
 * Validates form values for creating a manual transaction.
 * categoryId is intentionally not validated — it is optional and when provided,
 * is selected from a fixed list (STUB_CATEGORIES), so invalid values are
 * impossible through the UI.
 */
export const validateCreateTransaction = (
  values: CreateTransactionFormValues,
): CreateTransactionErrors => ({
  title: validateTitle(values.title),
  amount: validateAmount(values.amount),
  date: validateDate(values.date),
  type: validateType(values.type),
});

export const hasErrors = (errors: CreateTransactionErrors): boolean =>
  Object.values(errors).some((value) => value !== undefined);
