export const longestStreak = (
  counts: readonly number[],
  modeCount: number,
): number =>
  counts.reduce<{ max: number; current: number }>(
    (state, count) => {
      const next = count >= modeCount - 1 && count > 0 ? state.current + 1 : 0;
      return { max: Math.max(state.max, next), current: next };
    },
    { max: 0, current: 0 },
  ).max;
