import type { ReassemblyStrategy } from '#features/csv-import/model/parsing/types/reassembly-strategy';
import type { ReassemblyConfig } from '#features/csv-import/model/parsing/types/reassembly-config';

export interface ResolvedStrategy {
  readonly strategy: ReassemblyStrategy;
  readonly config: ReassemblyConfig;
}
