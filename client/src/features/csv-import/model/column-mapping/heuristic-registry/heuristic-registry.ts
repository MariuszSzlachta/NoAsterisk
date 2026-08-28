import type { DomainField } from '#features/csv-import/model/column-mapping/domain-field';
import type { HeaderHeuristic } from '#features/csv-import/model/column-mapping/header-heuristic';

export interface HeuristicRegistry {
  readonly match: (normalizedHeader: string) => DomainField | undefined;
  readonly register: (heuristic: HeaderHeuristic) => HeuristicRegistry;
  readonly getAll: () => readonly HeaderHeuristic[];
}
