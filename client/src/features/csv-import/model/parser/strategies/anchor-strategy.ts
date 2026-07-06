import type { ReassemblyConfig, ReassemblyStrategy } from '#features/csv-import/model/types';
import { AMOUNT_PATTERN, DATE_PATTERN } from '#features/csv-import/model/parser/strategies/patterns';

/**
 * AnchorStrategy — for CSVs where middle columns have unpredictable overflow
 * (unescaped separators, inconsistent empty fields) but START and END columns
 * have recognizable patterns.
 *
 * Algorithm:
 * 1. Match start anchors left-to-right (dates)
 * 2. Match end anchors right-to-left (amounts)
 * 3. Everything in between = merged into one middle blob
 *
 * This is STRUCTURALLY ROBUST:
 * - Doesn't matter how many separators are in the middle
 * - Only breaks if amounts appear before descriptions (= fundamentally different format)
 *
 * Example (mBank after trailing strip, 8 headers):
 *   Headers: [Data, Data ksi, Opis, Tytuł, Nadawca, Numer, Kwota, Saldo]
 *   Row (10 tokens): [14.06.2025, 14.06.2025, ZAKUP, ŻABKA, '', '', '', -14,80, 3 840,67]
 *   Start anchors (dates): 2 matched → [14.06.2025, 14.06.2025]
 *   End anchors (amounts): 2 matched → [-14,80, 3 840,67]
 *   Middle (6 tokens merged): "ZAKUP;ŻABKA;;;"
 *   Output: [14.06.2025, 14.06.2025, "ZAKUP;ŻABKA;;;", '', '', '', -14,80, 3 840,67]
 *
 * Wait — that's still 8 but middle is ONE field. We need to split middle back
 * into the correct number of header slots (expectedColumnCount - startAnchors - endAnchors).
 *
 * Revised approach: just merge ALL middle into the first middle slot, pad rest with empty.
 */
export const anchorStrategy: ReassemblyStrategy = {
  type: 'overflow-merge',

  reassemble(
    rawTokens: readonly string[],
    config: ReassemblyConfig,
  ): readonly string[] {
    const { expectedColumnCount, separator } = config;

    // No overflow — pass through (pad if needed)
    if (rawTokens.length <= expectedColumnCount) {
      const result = [...rawTokens];
      while (result.length < expectedColumnCount) {
        result.push('');
      }
      return result;
    }

    // Count start anchors (consecutive date-matching tokens from left)
    let startAnchorCount = 0;
    for (let i = 0; i < rawTokens.length; i++) {
      if (DATE_PATTERN.test(rawTokens[i]!.trim())) {
        startAnchorCount++;
      } else {
        break;
      }
    }

    // Count end anchors (consecutive amount-matching tokens from right)
    let endAnchorCount = 0;
    for (let i = rawTokens.length - 1; i >= startAnchorCount; i--) {
      if (AMOUNT_PATTERN.test(rawTokens[i]!.trim())) {
        endAnchorCount++;
      } else {
        break;
      }
    }

    // Safety: if we can't find anchors, fall back to basic overflow behavior
    if (startAnchorCount === 0 || endAnchorCount === 0) {
      // Fallback: take expectedColumnCount tokens from start, merge rest
      return rawTokens.slice(0, expectedColumnCount);
    }

    // Extract parts
    const startFields = rawTokens.slice(0, startAnchorCount);
    const endFields = rawTokens.slice(rawTokens.length - endAnchorCount);
    const middleTokens = rawTokens.slice(startAnchorCount, rawTokens.length - endAnchorCount);

    // How many middle header slots do we have?
    const middleSlotCount = expectedColumnCount - startAnchorCount - endAnchorCount;

    if (middleSlotCount <= 0) {
      // Edge case: more anchors than expected columns
      return rawTokens.slice(0, expectedColumnCount);
    }

    // Distribute middle tokens into middle slots:
    // First slot gets ALL overflow merged, rest are empty
    // This puts the full description into the first middle column (e.g. #Opis operacji)
    const mergedMiddle = middleTokens.join(separator);
    const middleFields: string[] = [mergedMiddle];
    for (let i = 1; i < middleSlotCount; i++) {
      middleFields.push('');
    }

    return [...startFields, ...middleFields, ...endFields];
  },
};
