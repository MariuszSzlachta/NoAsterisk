import type { ReassemblyConfig, ReassemblyStrategy } from '../../types';

/**
 * DirectStrategy — for clean CSVs where field count matches expected.
 * If row has exact field count → pass through.
 * If fewer fields → pad with empty strings.
 * If more fields → truncate (shouldn't happen for clean CSVs, but safe fallback).
 */
export const directStrategy: ReassemblyStrategy = {
  type: 'direct',

  reassemble(
    rawTokens: readonly string[],
    config: ReassemblyConfig,
  ): readonly string[] {
    const { expectedColumnCount } = config;

    if (rawTokens.length === expectedColumnCount) {
      return rawTokens;
    }

    if (rawTokens.length < expectedColumnCount) {
      const padded = [...rawTokens];
      while (padded.length < expectedColumnCount) {
        padded.push('');
      }
      return padded;
    }

    // More fields than expected — truncate to expected count
    return rawTokens.slice(0, expectedColumnCount);
  },
};
