import type { AccumulatorState } from '#features/csv-import/model/column-mapping/auto-detect/accumulator-state';

export const EMPTY_ACCUMULATOR_STATE: AccumulatorState = {
  mapping: {},
  usedFields: new Set(),
};
