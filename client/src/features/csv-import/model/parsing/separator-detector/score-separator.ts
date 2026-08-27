import { countUnquoted } from './count-unquoted';
import { findMode } from './find-mode';
import { longestStreak } from './longest-streak';

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
