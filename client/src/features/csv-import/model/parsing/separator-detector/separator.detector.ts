import { LINE_SPLIT_PATTERN } from '#features/csv-import/model/parsing/shared/patterns';

const CANDIDATES = [';', ',', '\t', '|'] as const;
const MAX_SAMPLE_LINES = 30;
const DEFAULT_SEPARATOR = ';';

/**
 * Detect CSV separator by statistical analysis.
 *
 * Combines streak-based (longest consecutive run of lines with same count)
 * and mode-based (most common non-zero count) scoring.
 */
export const detectSeparator = (text: string): string => {
  const lines = text
    .split(LINE_SPLIT_PATTERN)
    .filter((l) => l.trim().length > 0)
    .slice(0, MAX_SAMPLE_LINES);

  if (lines.length === 0) {
    return DEFAULT_SEPARATOR;
  }

  const scored = CANDIDATES.map((sep) => ({
    sep,
    score: scoreSeparator(lines, sep),
  }));

  const best = scored.reduce((a, b) => (b.score > a.score ? b : a));
  return best.score > 0 ? best.sep : DEFAULT_SEPARATOR;
};

export const scoreSeparator = (
  lines: readonly string[],
  sep: string,
): number => {
  const counts = lines.map((line) => countUnquoted(line, sep));
  const nonZeroCounts = counts.filter((c) => c > 0);

  if (nonZeroCounts.length === 0) {
    return 0;
  }

  const { count: modeCount, frequency: modeFreq } = findMode(nonZeroCounts);
  const maxStreak = longestStreak(counts, modeCount);
  const matchRatio = modeFreq / lines.length;
  const streakBonus = maxStreak / lines.length;

  return modeCount * (matchRatio + streakBonus);
};

export const findMode = (
  values: readonly number[],
): { count: number; frequency: number } => {
  const freq = values.reduce<ReadonlyMap<number, number>>(
    (map, c) => new Map([...map, [c, (map.get(c) ?? 0) + 1]]),
    new Map(),
  );

  return Array.from(freq.entries()).reduce(
    (best, [count, frequency]) =>
      frequency > best.frequency ||
      (frequency === best.frequency && count > best.count)
        ? { count, frequency }
        : best,
    { count: 0, frequency: 0 },
  );
};

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

export const countUnquoted = (line: string, char: string): number =>
  Array.from(line).reduce<{ count: number; inQuotes: boolean }>(
    (state, c) => {
      if (c === '"') {
        return { ...state, inQuotes: !state.inQuotes };
      }
      if (!state.inQuotes && c === char) {
        return { ...state, count: state.count + 1 };
      }
      return state;
    },
    { count: 0, inQuotes: false },
  ).count;
