/** Formats a numeric amount to Polish locale with currency suffix. */
export const formatAnalyticsAmount = (amount: number): string => {
  // REVIEW [P1]: Math.abs usuwa znak także dla balance/savings. Ujemne saldo
  // zostanie pokazane jako dodatnie, czyli użytkownik dostaje błędną informację
  // finansową. Rozdziel formatter signed KPI od absolute expense/category value
  // i dodaj testy dla wartości ujemnych.
  const formatted = Math.abs(amount).toLocaleString('pl-PL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${formatted} zł`;
};
