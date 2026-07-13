import { subDays, subMonths, startOfDay } from 'date-fns';
import type { DateRange } from 'react-day-picker';

// ─── Types ───────────────────────────────────────────────────────

export interface DateRangePreset {
  readonly label: string;
  readonly range: () => DateRange;
}

// ─── Default Presets ─────────────────────────────────────────────

export const DEFAULT_PRESETS: readonly DateRangePreset[] = [
  {
    label: 'Ostatni tydzień',
    range: () => ({
      from: startOfDay(subDays(new Date(), 7)),
      to: startOfDay(new Date()),
    }),
  },
  {
    label: 'Ostatni miesiąc',
    range: () => ({
      from: startOfDay(subMonths(new Date(), 1)),
      to: startOfDay(new Date()),
    }),
  },
  {
    label: 'Ostatnie 3 miesiące',
    range: () => ({
      from: startOfDay(subMonths(new Date(), 3)),
      to: startOfDay(new Date()),
    }),
  },
];
