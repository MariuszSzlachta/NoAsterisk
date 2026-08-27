import { ID_CONTEXT } from './constants/id-context';

export const hasIdContext = (text: string, start: number): boolean => {
  const prefix = text.slice(Math.max(0, start - 30), start).toLowerCase();
  return ID_CONTEXT.some((kw) => prefix.includes(kw));
};
