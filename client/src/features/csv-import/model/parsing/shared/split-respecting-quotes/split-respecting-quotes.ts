import type { SplitState } from '#features/csv-import/model/parsing/shared/split-respecting-quotes/split-state';
import { INITIAL_STATE } from '#features/csv-import/model/parsing/shared/split-respecting-quotes/constants/initial-state';

export const splitRespectingQuotes = (
  line: string,
  separator: string,
): readonly string[] => {
  const final = Array.from(line).reduce<SplitState>((state, char) => {
    if (char === '"') {
      return {
        ...state,
        current: state.current + char,
        inQuotes: !state.inQuotes,
      };
    }
    if (char === separator && !state.inQuotes) {
      return {
        fields: [...state.fields, state.current],
        current: '',
        inQuotes: state.inQuotes,
      };
    }
    return { ...state, current: state.current + char };
  }, INITIAL_STATE);

  return [...final.fields, final.current];
};
