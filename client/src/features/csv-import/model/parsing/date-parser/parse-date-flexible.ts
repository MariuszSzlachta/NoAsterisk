import { ALL_FORMATS, isValidDate, toIsoDateString } from './date-formats';

export const parseDateFlexible = (value: string): string | null => {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }

  const result = ALL_FORMATS.reduce<string | null>((found, fmt) => {
    if (found !== null) {
      return found;
    }
    const match = trimmed.match(fmt.regex);
    if (!match) {
      return null;
    }
    const parsed = fmt.parse(match);
    if (
      parsed === null ||
      !isValidDate(parsed.year, parsed.month, parsed.day)
    ) {
      return null;
    }
    return toIsoDateString(parsed.year, parsed.month, parsed.day);
  }, null);

  return result;
};
