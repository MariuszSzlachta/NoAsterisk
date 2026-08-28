export const formatSeparator = (sep: string): string => {
  if (sep === ';') {
    return 'Średnik ( ; )';
  }
  if (sep === ',') {
    return 'Przecinek ( , )';
  }
  if (sep === '\t') {
    return 'Tab';
  }
  if (sep === '|') {
    return 'Pipe ( | )';
  }
  return sep;
};
