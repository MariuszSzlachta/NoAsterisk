import type { ReassemblyStrategyType } from '#features/csv-import/model/parsing/types/reassembly-strategy-type';
import type { ReassemblyConfig } from '#features/csv-import/model/parsing/types/reassembly-config';

export interface ReassemblyStrategy {
  readonly type: ReassemblyStrategyType;
  reassemble(
    rawTokens: readonly string[],
    config: ReassemblyConfig,
  ): readonly string[];
}
