import type { AccumulatorState } from '#features/csv-import/model/column-mapping/auto-detect/accumulator-state';
import { EMPTY_ACCUMULATOR_STATE } from '#features/csv-import/model/column-mapping/auto-detect/empty-accumulator-state';
import { defaultHeuristicRegistry } from '#features/csv-import/model/column-mapping/heuristics/default-heuristic-registry';
import { normalizeHeader } from '#features/csv-import/model/column-mapping/normalize-header';
import { MERGEABLE_FIELDS } from '#features/csv-import/model/column-mapping/mergeable-fields';
import type {
  ColumnMapping,
  HeuristicRegistry,
} from '#features/csv-import/model/column-mapping/types';

export const autoDetectMapping = (
  headers: readonly string[],
  registry: HeuristicRegistry = defaultHeuristicRegistry,
): ColumnMapping =>
  headers.reduce<AccumulatorState>((acc, header) => {
    const normalized = normalizeHeader(header);
    const field = registry.match(normalized);

    if (!field || (acc.usedFields.has(field) && !MERGEABLE_FIELDS.has(field))) {
      return acc;
    }

    return {
      mapping: { ...acc.mapping, [header]: field },
      usedFields: new Set([...acc.usedFields, field]),
    };
  }, EMPTY_ACCUMULATOR_STATE).mapping;
