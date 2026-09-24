import { pl } from 'date-fns/locale';
import { DayPicker } from 'react-day-picker';
import type { DateRange } from 'react-day-picker';

import './calendar.css';

// ─── Types ───────────────────────────────────────────────────────

interface CalendarSingleProps {
  readonly mode: 'single';
  readonly selected?: Date;
  readonly onSelect?: (date: Date | undefined) => void;
  readonly disabled?: (date: Date) => boolean;
  readonly className?: string;
  readonly numberOfMonths?: number;
}

interface CalendarRangeProps {
  readonly mode: 'range';
  readonly selected?: DateRange;
  readonly onSelect?: (range: DateRange | undefined) => void;
  readonly disabled?: (date: Date) => boolean;
  readonly className?: string;
  readonly numberOfMonths?: number;
}

export type CalendarProps = CalendarSingleProps | CalendarRangeProps;

// ─── Constants ───────────────────────────────────────────────────

const CALENDAR_CLASS_PREFIX = 'budget-calendar';

// ─── Component ───────────────────────────────────────────────────

export const Calendar = (props: CalendarProps): React.JSX.Element => {
  const calendarClassName = [CALENDAR_CLASS_PREFIX, props.className].filter(Boolean).join(' ');

  const sharedProps = {
    disabled: props.disabled,
    locale: pl,
    numberOfMonths: props.numberOfMonths,
    showOutsideDays: true,
    className: calendarClassName,
  };

  if (props.mode === 'range') {
    return (
      <DayPicker
        mode="range"
        weekStartsOn={1}
        selected={props.selected}
        onSelect={props.onSelect}
        {...sharedProps}
      />
    );
  }

  return (
    <DayPicker
    mode="single"
    weekStartsOn={1}
      selected={props.selected}
      onSelect={props.onSelect}
      {...sharedProps}
    />
  );
};
