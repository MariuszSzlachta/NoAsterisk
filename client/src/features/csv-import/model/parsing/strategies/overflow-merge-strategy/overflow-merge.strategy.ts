import { padToLength } from '#features/csv-import/model/parsing/shared/pad-to-length';
import type { ReassemblyConfig } from '#features/csv-import/model/parsing/types/reassembly-config';
import type { ReassemblyStrategy } from '#features/csv-import/model/parsing/types/reassembly-strategy';

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
