import type { DomainField } from '#features/csv-import/model/column-mapping/domain-field';
import type { HeaderHeuristic } from '#features/csv-import/model/column-mapping/header-heuristic';
import type { HeuristicRegistry } from '#features/csv-import/model/column-mapping/heuristic-registry';

import { BUILTIN_HEURISTICS } from '#features/csv-import/model/column-mapping/heuristics/builtin-heuristics';

export const createHeuristicRegistry = (
  entries: readonly HeaderHeuristic[] = BUILTIN_HEURISTICS,
): HeuristicRegistry => ({
  match: (normalizedHeader: string): DomainField | undefined =>
    entries.find((h) => h.normalized === normalizedHeader)?.field,

  register: (heuristic: HeaderHeuristic): HeuristicRegistry =>
    createHeuristicRegistry([heuristic, ...entries]),

  getAll: (): readonly HeaderHeuristic[] => entries,
});
