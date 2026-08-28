export const walkBackToCandidate = (
  lines: readonly string[],
  fromIndex: number,
): number | null => {
  const candidates = lines
    .slice(0, fromIndex)
    .map((line, i) => ({ line, index: i }))
    .filter(({ line }) => line.trim().length > 0);

  const last = candidates[candidates.length - 1];
  return last !== undefined ? last.index : null;
};
