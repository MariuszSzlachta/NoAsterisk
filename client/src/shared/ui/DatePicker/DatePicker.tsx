import { CalendarDays } from 'lucide-react';
import { format, isValid, parseISO } from 'date-fns';
import {
  Popover,
  PopoverContent,
  PopoverPortal,
  PopoverTrigger,
} from '@radix-ui/react-popover';

import { Calendar } from '#shared/ui/Calendar';

interface DatePickerProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly label?: string;
  readonly error?: string;
  readonly open?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
}

export const DatePicker = ({
  value,
  onChange,
  label,
  error,
  open,
  onOpenChange,
}: DatePickerProps): React.JSX.Element => {
  const selectedDate = value ? parseISO(value) : undefined;
  const validDate = selectedDate && isValid(selectedDate) ? selectedDate : undefined;

  return (
    <div className="flex w-full flex-col gap-1.5">
      {label && (
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
      )}
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={`flex h-9 w-full items-center justify-between rounded-md border bg-surface px-3 text-left text-sm outline-none transition-colors focus:border-ring focus:ring-1 focus:ring-ring ${
              error ? 'border-expense' : 'border-border'
            }`}
            aria-label={label}
          >
            <span className={validDate ? 'text-foreground' : 'text-subtle'}>
              {validDate ? format(validDate, 'dd.MM.yyyy') : 'Wybierz datę'}
            </span>
            <CalendarDays size={16} className="text-muted-foreground" aria-hidden="true" />
          </button>
        </PopoverTrigger>
        <PopoverPortal>
          <PopoverContent
            align="start"
            sideOffset={4}
            className="z-[60] rounded-lg border border-border bg-surface p-3 shadow-card"
          >
            <Calendar
              mode="single"
              selected={validDate}
              onSelect={(date) => onChange(date ? format(date, 'yyyy-MM-dd') : '')}
            />
          </PopoverContent>
        </PopoverPortal>
      </Popover>
      {error && <p className="text-xs text-expense" role="alert">{error}</p>}
    </div>
  );
};
