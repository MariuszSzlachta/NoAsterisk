import type { ReassemblyConfig, ReassemblyStrategy } from '#features/csv-import/model/parsing/types';
import { padToLength } from '#features/csv-import/model/parsing/shared/pad-to-length';
import { AMOUNT_PATTERN, DATE_PATTERN } from './patterns';

/**
 * For CSVs where middle columns have unpredictable overflow but START (dates)
 * and END (amounts) columns have recognizable patterns.
 *
 * 1. Match start anchors left-to-right (dates)
 * 2. Match end anchors right-to-left (amounts)
 * 3. Everything in between merged into first middle slot, rest padded empty
 */
export const anchorStrategy: ReassemblyStrategy = {
  type: 'overflow-merge',

  reassemble(rawTokens: readonly string[], config: ReassemblyConfig): readonly string[] {
    const { expectedColumnCount, separator } = config;

    if (rawTokens.length <= expectedColumnCount) {
      return padToLength(rawTokens, expectedColumnCount);
    }

    const startAnchorCount = rawTokens.findIndex(
      (t) => !DATE_PATTERN.test(t.trim()),
    );
    const effectiveStartAnchors = startAnchorCount === -1 ? rawTokens.length : startAnchorCount;

    const reversedFromStart = rawTokens
      .slice(effectiveStartAnchors)
      .reverse();
    const endAnchorCount = reversedFromStart.findIndex(
      (t) => !AMOUNT_PATTERN.test(t.trim()),
    );
    const effectiveEndAnchors = endAnchorCount === -1 ? reversedFromStart.length : endAnchorCount;

    if (effectiveStartAnchors === 0 || effectiveEndAnchors === 0) {
      return rawTokens.slice(0, expectedColumnCount);
    }

    const startFields = rawTokens.slice(0, effectiveStartAnchors);
    const endFields = rawTokens.slice(rawTokens.length - effectiveEndAnchors);
    const middleTokens = rawTokens.slice(effectiveStartAnchors, rawTokens.length - effectiveEndAnchors);

    const middleSlotCount = expectedColumnCount - effectiveStartAnchors - effectiveEndAnchors;

    if (middleSlotCount <= 0) {
      return rawTokens.slice(0, expectedColumnCount);
    }

    const mergedMiddle = middleTokens.join(separator);
    const middleFields = padToLength([mergedMiddle], middleSlotCount);

    return [...startFields, ...middleFields, ...endFields];
  },
};
