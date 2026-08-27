import type { ResolvedStrategy } from '#features/csv-import/model/parsing/types';

import { anchorStrategy } from './anchor.strategy';
import { detectOverflowColumnIndex } from './detect-overflow-column-index';
import { directStrategy } from './direct.strategy';
import { hasAnchorPattern } from './has-anchor-pattern';
import { hasOverflowRows } from './has-overflow-rows';
import { overflowMergeStrategy } from './overflow-merge.strategy';

/**
 * Decision logic:
 * 1. Anchor pattern (dates start, amounts end) → Anchor
 * 2. No overflow rows → Direct
 * 3. Overflow + identifiable overflow column → OverflowMerge
 * 4. Otherwise → Direct (safe fallback)
 */
export const resolveStrategy = (
  headers: readonly string[],
  dataRows: readonly (readonly string[])[],
  separator: string,
): ResolvedStrategy => {
  const expectedColumnCount = headers.length;

  if (hasAnchorPattern(dataRows)) {
    return {
      strategy: anchorStrategy,
      config: { expectedColumnCount, separator },
    };
  }

  if (!hasOverflowRows(dataRows, expectedColumnCount)) {
    return {
      strategy: directStrategy,
      config: { expectedColumnCount, separator },
    };
  }

  const overflowColumnIndex = detectOverflowColumnIndex(headers);

  if (overflowColumnIndex === undefined) {
    return {
      strategy: directStrategy,
      config: { expectedColumnCount, separator },
    };
  }

  const fixedTailColumns = expectedColumnCount - overflowColumnIndex - 1;

  return {
    strategy: overflowMergeStrategy,
    config: {
      expectedColumnCount,
      separator,
      overflowColumnIndex,
      fixedTailColumns,
    },
  };
};
