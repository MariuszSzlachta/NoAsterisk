export const walkBackToCandidate = (
  lines: readonly string[],
  fromIndex: number,
): number | null => {
  const candidates = lines
    .slice(0, fromIndex)
    .map((line, i) => ({ line, index: i }))
    .filter(({ line }) => line.trim().length > 0);

  return candidates.length > 0
    ? candidates[candidates.length - 1]!.index
    : null;
};
