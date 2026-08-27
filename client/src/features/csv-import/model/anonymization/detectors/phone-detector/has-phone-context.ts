import { PHONE_CONTEXT_KEYWORDS } from './constants/phone-context-keywords';

export const hasPhoneContext = (text: string, start: number): boolean => {
  const prefix = text.slice(Math.max(0, start - 20), start).toLowerCase();
  return PHONE_CONTEXT_KEYWORDS.some((kw) => prefix.includes(kw));
};
