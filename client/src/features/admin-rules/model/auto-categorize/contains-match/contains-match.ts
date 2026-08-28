export const containsMatch = (description: string, keyword: string): boolean =>
  description.toLowerCase().includes(keyword.toLowerCase());
