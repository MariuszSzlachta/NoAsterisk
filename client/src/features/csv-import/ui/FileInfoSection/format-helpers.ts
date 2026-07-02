export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${Math.round(kb)} KB`;
  }
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
};

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
