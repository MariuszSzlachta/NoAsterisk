import type { ColumnMapping, DomainField, HeuristicRegistry } from '../types';
import { MERGEABLE_FIELDS } from '../types';
import { defaultHeuristicRegistry } from '../heuristics/default-heuristic-registry';
import { normalizeHeader } from '../normalize-header';

interface AccumulatorState {
  readonly mapping: ColumnMapping;
  readonly usedFields: ReadonlySet<DomainField>;
}

const EMPTY_STATE: AccumulatorState = { mapping: {}, usedFields: new Set() };

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
