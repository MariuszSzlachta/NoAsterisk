/**
 * Rounds a raw step to the nearest "nice" number (1, 2, 5, 10, 20, 50, ...).
 */
export const roundToNiceStep = (rawStep: number): number => {
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const fraction = rawStep / magnitude;

  if (fraction <= 1) {
    return magnitude;
  }
  if (fraction <= 2) {
    return 2 * magnitude;
  }
  if (fraction <= 5) {
    return 5 * magnitude;
  }
  return 10 * magnitude;
};
