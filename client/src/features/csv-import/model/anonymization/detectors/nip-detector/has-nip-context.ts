import { NIP_CONTEXT } from './constants/nip-context';

export const hasNipContext = (text: string, start: number): boolean => {
  const prefix = text.slice(Math.max(0, start - 20), start).toLowerCase();
  return NIP_CONTEXT.some((kw) => prefix.includes(kw));
};
