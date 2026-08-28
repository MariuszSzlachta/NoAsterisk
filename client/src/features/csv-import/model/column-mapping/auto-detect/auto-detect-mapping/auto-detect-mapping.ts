import { defaultHeuristicRegistry } from '#features/csv-import/model/column-mapping/heuristics/default-heuristic-registry';
import { normalizeHeader } from '#features/csv-import/model/column-mapping/normalize-header';
import {
  MERGEABLE_FIELDS,
  type ColumnMapping,
  type DomainField,
  type HeuristicRegistry,
} from '#features/csv-import/model/column-mapping/types';

interface AccumulatorState {
  readonly mapping: ColumnMapping;
  readonly usedFields: ReadonlySet<DomainField>;
}

export const EMPTY_STATE: AccumulatorState = { mapping: {}, usedFields: new Set() };

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
  }, EMPTY_STATE).mapping;
