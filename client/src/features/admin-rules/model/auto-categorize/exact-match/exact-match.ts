export const exactMatch = (description: string, keyword: string): boolean =>
  description.toLowerCase() === keyword.toLowerCase();
