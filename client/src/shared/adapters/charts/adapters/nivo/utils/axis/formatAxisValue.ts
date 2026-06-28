/**
 * Formats a numeric axis value for display.
 * - ≥10k → "12k"
 * - 1k–10k → "2.1k" (1 decimal if fractional, "2k" if round)
 * - <1k → raw number
 */
export const formatAxisValue = (v: number): string => {
  const abs = Math.abs(v);

  if (abs >= 10000) {
    return `${(v / 1000).toFixed(0)}k`;
  }
  if (abs >= 1000) {
    const k = v / 1000;
    const isRound = k === Math.floor(k);
    return isRound ? `${k.toFixed(0)}k` : `${k.toFixed(1)}k`;
  }
  return String(v);
};
