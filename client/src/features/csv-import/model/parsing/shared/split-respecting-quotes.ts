interface SplitState {
  readonly fields: readonly string[];
  readonly current: string;
  readonly inQuotes: boolean;
}

const INITIAL_STATE: SplitState = { fields: [], current: '', inQuotes: false };

export const splitRespectingQuotes = (line: string, separator: string): readonly string[] => {
  const final = Array.from(line).reduce<SplitState>((state, char) => {
    if (char === '"') {
      return { ...state, current: state.current + char, inQuotes: !state.inQuotes };
    }
    if (char === separator && !state.inQuotes) {
      return { fields: [...state.fields, state.current], current: '', inQuotes: state.inQuotes };
    }
    return { ...state, current: state.current + char };
  }, INITIAL_STATE);

  return [...final.fields, final.current];
};
