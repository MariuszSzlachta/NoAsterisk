const formatterCache = new Map<string, Intl.NumberFormat>();

export const formatCurrency = (amount: number, currency: string): string => {
  let formatter = formatterCache.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency,
      signDisplay: 'always',
    });
    formatterCache.set(currency, formatter);
  }
  return formatter.format(amount);
};
