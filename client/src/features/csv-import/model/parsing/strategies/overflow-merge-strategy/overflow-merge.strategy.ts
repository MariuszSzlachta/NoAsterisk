import { padToLength } from '#features/csv-import/model/parsing/shared/pad-to-length';
import type {
  ReassemblyConfig,
  ReassemblyStrategy,
} from '#features/csv-import/model/parsing/types';

/**
 * For CSVs where a known column (e.g. description) contains unescaped separators.
 * "Parse from end" — last N columns are fixed position, everything between
 * head and tail columns is merged back into the overflow column.
 */
export const overflowMergeStrategy: ReassemblyStrategy = {
  type: 'overflow-merge',

  reassemble(
    rawTokens: readonly string[],
    config: ReassemblyConfig,
  ): readonly string[] {
    const { expectedColumnCount, separator, overflowColumnIndex } = config;

    if (rawTokens.length <= expectedColumnCount) {
      return padToLength(rawTokens, expectedColumnCount);
    }

    const overflow = overflowColumnIndex ?? 1;
    const overflowTokenCount = rawTokens.length - expectedColumnCount + 1;

    const head = rawTokens.slice(0, overflow);
    const mergedOverflow = rawTokens
      .slice(overflow, overflow + overflowTokenCount)
      .join(separator);
    const tail = rawTokens.slice(overflow + overflowTokenCount);

    return [...head, mergedOverflow, ...tail];
  },
};
