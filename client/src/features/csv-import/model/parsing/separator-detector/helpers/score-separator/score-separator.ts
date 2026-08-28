import { countUnquoted } from '#features/csv-import/model/parsing/separator-detector/helpers/count-unquoted';
import { findMode } from '#features/csv-import/model/parsing/separator-detector/helpers/find-mode';
import { longestStreak } from '#features/csv-import/model/parsing/separator-detector/helpers/longest-streak';

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
