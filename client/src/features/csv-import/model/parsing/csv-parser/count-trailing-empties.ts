export const countTrailingEmpties = (arr: readonly string[]): number =>
  [...arr].reverse().findIndex((s) => s !== '');
