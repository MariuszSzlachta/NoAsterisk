/**
 * Formats a numeric amount in Polish locale (e.g., 1 234,56).
 */
export const formatAmount = (amount: number): string =>
  new Intl.NumberFormat('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    .format(amount);
