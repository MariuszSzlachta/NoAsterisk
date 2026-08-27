import { PESEL_CONTEXT } from './constants/pesel-context';

export const hasPeselContext = (text: string, start: number): boolean => {
  const prefix = text.slice(Math.max(0, start - 25), start).toLowerCase();
  return PESEL_CONTEXT.some((kw) => prefix.includes(kw));
};
