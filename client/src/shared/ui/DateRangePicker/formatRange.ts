import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';

const DATE_FORMAT = 'd MMM yyyy';

export const formatRange = (range: DateRange | undefined): string | undefined => {
  if (!range?.from) {
    return undefined;
  }
  const fromStr = format(range.from, DATE_FORMAT, { locale: pl });
  if (!range.to) {
    return fromStr;
  }
  const toStr = format(range.to, DATE_FORMAT, { locale: pl });
  return `${fromStr} – ${toStr}`;
};
