import type { ReassemblyConfig, ReassemblyStrategy } from '../../types';

/**
 * OverflowMergeStrategy — for CSVs where a known column (e.g. description)
 * contains unescaped separators, causing rows to have more fields than expected.
 *
 * Logic: "parse from end" — last N columns are always fixed (known position
 * from the end). Everything between the head columns and tail columns is
 * merged back into the overflow column using the original separator.
 *
 * Example (mBank):
 *   Header: [Data, Opis, Rachunek, Kategoria, Kwota, ""]  (6 cols)
 *   Row:    [2026-07-01, ZUS, PRZELEW, 436000..., mBiznes, Ubezpieczenia, -2635.98 PLN, ""]  (8 tokens)
 *   fixedTailColumns = 4 (Rachunek, Kategoria, Kwota, trailing empty)
 *   overflowColumnIndex = 1 (Opis)
 *   Result: [2026-07-01, "ZUS;PRZELEW;436000...", mBiznes, Ubezpieczenia, -2635.98 PLN, ""]
 */
export const overflowMergeStrategy: ReassemblyStrategy = {
  type: 'overflow-merge',

  reassemble(
    rawTokens: readonly string[],
    config: ReassemblyConfig,
  ): readonly string[] {
    const { expectedColumnCount, separator, overflowColumnIndex, fixedTailColumns } = config;

    // No overflow — delegate to direct mapping
    if (rawTokens.length <= expectedColumnCount) {
      const result = [...rawTokens];
      while (result.length < expectedColumnCount) {
        result.push('');
      }
      return result;
    }

    const overflow = overflowColumnIndex ?? 1;
    const tailCount = fixedTailColumns ?? (expectedColumnCount - overflow - 1);
    const headCount = overflow; // columns before the overflow column

    const overflowTokenCount = rawTokens.length - expectedColumnCount + 1;

    // Head: columns before overflow (e.g. [Data])
    const head = rawTokens.slice(0, headCount);

    // Overflow: merge tokens back with separator
    const overflowTokens = rawTokens.slice(headCount, headCount + overflowTokenCount);
    const mergedOverflow = overflowTokens.join(separator);

    // Tail: fixed columns from the end
    const tail = rawTokens.slice(headCount + overflowTokenCount);

    return [...head, mergedOverflow, ...tail];
  },
};
