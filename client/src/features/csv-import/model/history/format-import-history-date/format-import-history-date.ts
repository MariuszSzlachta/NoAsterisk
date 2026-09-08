export const formatImportHistoryDate = (
  completedAt: string,
  locale: string,
): string =>
  new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(completedAt));
