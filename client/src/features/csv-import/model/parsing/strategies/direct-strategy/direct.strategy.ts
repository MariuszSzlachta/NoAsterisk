import { padToLength } from '#features/csv-import/model/parsing/shared/pad-to-length';
import type { ReassemblyConfig } from '#features/csv-import/model/parsing/types/reassembly-config';
import type { ReassemblyStrategy } from '#features/csv-import/model/parsing/types/reassembly-strategy';

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
      return padToLength(rawTokens, expectedColumnCount);
    }
    return rawTokens.slice(0, expectedColumnCount);
  },
};
