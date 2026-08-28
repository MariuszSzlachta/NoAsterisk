import type {
  DomainField,
  HeaderHeuristic,
  HeuristicRegistry,
} from '#features/csv-import/model/column-mapping/types';

import { BUILTIN_HEURISTICS } from '#features/csv-import/model/column-mapping/heuristics/field-heuristics';

export const createHeuristicRegistry = (
  entries: readonly HeaderHeuristic[] = BUILTIN_HEURISTICS,
): HeuristicRegistry => ({
  match: (normalizedHeader: string): DomainField | undefined =>
    entries.find((h) => h.normalized === normalizedHeader)?.field,

  register: (heuristic: HeaderHeuristic): HeuristicRegistry =>
    createHeuristicRegistry([heuristic, ...entries]),

  getAll: (): readonly HeaderHeuristic[] => entries,
});
