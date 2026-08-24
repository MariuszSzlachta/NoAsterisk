/** Computes percentage delta between two values, formatted as string. */
export const computeDelta = (current: number, previous: number): string => {
  if (previous === 0) {
    return current === 0 ? '0,0%' : '+∞';
  }
  const percent = ((current - previous) / Math.abs(previous)) * 100;
  const sign = percent >= 0 ? '+' : '';
  return `${sign}${percent.toFixed(1).replace('.', ',')}%`;
};

/** Determines trend direction based on value comparison. */
export const computeTrend = (current: number, previous: number): 'up' | 'down' | 'neutral' => {
  if (current > previous) return 'up';
  if (current < previous) return 'down';
  return 'neutral';
};
