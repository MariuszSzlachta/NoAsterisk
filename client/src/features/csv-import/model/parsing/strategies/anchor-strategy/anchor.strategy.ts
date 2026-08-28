import { padToLength } from '#features/csv-import/model/parsing/shared/pad-to-length';
import type { ReassemblyConfig } from '#features/csv-import/model/parsing/types/reassembly-config';
import type { ReassemblyStrategy } from '#features/csv-import/model/parsing/types/reassembly-strategy';

import { AMOUNT_PATTERN } from '#features/csv-import/model/parsing/strategies/constants/amount.pattern';
import { DATE_PATTERN } from '#features/csv-import/model/parsing/strategies/constants/date.pattern';

export const anchorStrategy: ReassemblyStrategy = {
  type: 'overflow-merge',

  reassemble(
    rawTokens: readonly string[],
    config: ReassemblyConfig,
  ): readonly string[] {
    const { expectedColumnCount, separator } = config;

    if (rawTokens.length <= expectedColumnCount) {
      return padToLength(rawTokens, expectedColumnCount);
    }

    const startAnchorCount = rawTokens.findIndex(
      (t) => !DATE_PATTERN.test(t.trim()),
    );
    const effectiveStartAnchors =
      startAnchorCount === -1 ? rawTokens.length : startAnchorCount;

    const reversedFromStart = rawTokens.slice(effectiveStartAnchors).reverse();
    const endAnchorCount = reversedFromStart.findIndex(
      (t) => !AMOUNT_PATTERN.test(t.trim()),
    );
    const effectiveEndAnchors =
      endAnchorCount === -1 ? reversedFromStart.length : endAnchorCount;

    if (effectiveStartAnchors === 0 || effectiveEndAnchors === 0) {
      return rawTokens.slice(0, expectedColumnCount);
    }

    const startFields = rawTokens.slice(0, effectiveStartAnchors);
    const endFields = rawTokens.slice(rawTokens.length - effectiveEndAnchors);
    const middleTokens = rawTokens.slice(
      effectiveStartAnchors,
      rawTokens.length - effectiveEndAnchors,
    );

    const middleSlotCount =
      expectedColumnCount - effectiveStartAnchors - effectiveEndAnchors;

    if (middleSlotCount <= 0) {
      return rawTokens.slice(0, expectedColumnCount);
    }

    const mergedMiddle = middleTokens.join(separator);
    const middleFields = padToLength([mergedMiddle], middleSlotCount);

    return [...startFields, ...middleFields, ...endFields];
  },
};
