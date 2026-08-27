import { NAME_CONTEXT_KEYWORDS } from './constants/name-context-keywords';

export const hasNameContext = (text: string, start: number): boolean => {
  const prefix = text.slice(Math.max(0, start - 30), start).toLowerCase();
  return NAME_CONTEXT_KEYWORDS.some((kw) => prefix.includes(kw));
};
