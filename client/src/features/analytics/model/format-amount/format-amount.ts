/** Formats a numeric amount as absolute value with Polish locale and currency suffix.
 * Use for expenses, category totals — where sign is irrelevant.
 */
export const formatAbsoluteAmount = (amount: number): string => {
  const formatted = Math.abs(amount).toLocaleString('pl-PL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${formatted} zł`;
};

/** Formats a numeric amount preserving sign, with Polish locale and currency suffix.
 * Use for KPI values (balance, savings) where negative values carry meaning.
 */
export const formatSignedAmount = (amount: number): string => {
  const formatted = amount.toLocaleString('pl-PL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${formatted} zł`;
};

/**
 * @deprecated Use formatAbsoluteAmount or formatSignedAmount instead.
 * Kept for backward compatibility — delegates to formatAbsoluteAmount.
 */
export const formatAnalyticsAmount = (amount: number): string =>
  formatAbsoluteAmount(amount);
