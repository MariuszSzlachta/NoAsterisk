const SERIES_COLOR: Record<string, string> = {
  Saldo: 'var(--primary)',
  Przychody: 'var(--income)',
  Wydatki: 'var(--expense)',
  Oszczędności: 'var(--warning)',
};

export const getSeriesColors = (seriesIds: string[]): string[] =>
  seriesIds.map((id) => SERIES_COLOR[id] ?? 'var(--primary)');
