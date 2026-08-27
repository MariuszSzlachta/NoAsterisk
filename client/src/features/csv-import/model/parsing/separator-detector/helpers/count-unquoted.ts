export const countUnquoted = (line: string, char: string): number =>
  Array.from(line).reduce<{ count: number; inQuotes: boolean }>(
    (state, c) => {
      if (c === '"') {
        return { ...state, inQuotes: !state.inQuotes };
      }
      if (!state.inQuotes && c === char) {
        return { ...state, count: state.count + 1 };
      }
      return state;
    },
    { count: 0, inQuotes: false },
  ).count;
