import type { SplitState } from '#features/csv-import/model/parsing/shared/split-respecting-quotes/split-state';

export const INITIAL_STATE: SplitState = { fields: [], current: '', inQuotes: false };
