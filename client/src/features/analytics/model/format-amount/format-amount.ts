/** Formats a numeric amount to Polish locale with currency suffix. */
export const formatAnalyticsAmount = (amount: number): string => {
  const formatted = Math.abs(amount).toLocaleString('pl-PL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${formatted} zł`;
};
