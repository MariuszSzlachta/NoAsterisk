import { CalendarDays } from 'lucide-react';
import {
  PopoverContent,
  PopoverPortal,
  Popover,
  PopoverTrigger,
} from '@radix-ui/react-popover';
import { useState } from 'react';
import type { DateRange } from 'react-day-picker';

import { Calendar } from '#shared/ui/Calendar';

import { formatRange } from './formatRange';
import { DEFAULT_PRESETS, type DateRangePreset } from './presets';

// ─── Types ───────────────────────────────────────────────────────

interface DateRangePickerProps {
  readonly selected?: DateRange;
  readonly onSelect: (range: DateRange | undefined) => void;
  readonly presets?: readonly DateRangePreset[];
  readonly disabled?: boolean;
  readonly placeholder?: string;
  readonly className?: string;
}

// ─── Constants ───────────────────────────────────────────────────

const DEFAULT_PLACEHOLDER = 'Wybierz zakres dat';

// ─── Component ───────────────────────────────────────────────────

export const DateRangePicker = ({
  selected,
  onSelect,
  presets = DEFAULT_PRESETS,
  disabled = false,
  placeholder = DEFAULT_PLACEHOLDER,
  className,
}: DateRangePickerProps): React.JSX.Element => {
  const [open, setOpen] = useState(false);

  const displayValue = formatRange(selected);

  const handlePresetClick = (preset: DateRangePreset): void => {
    onSelect(preset.range());
    setOpen(false);
  };

  const handleCalendarSelect = (range: DateRange | undefined): void => {
    onSelect(range);
    if (range?.from && range.to) {
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <button
          type="button"
          className={[
            'flex h-8 items-center gap-2 rounded-md border border-border bg-surface px-3',
            'text-xs transition-colors duration-150',
            'hover:border-border-strong hover:bg-surface-2',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            'disabled:cursor-not-allowed disabled:opacity-50',
            displayValue ? 'text-foreground' : 'text-muted-foreground',
            className,
          ].filter(Boolean).join(' ')}
        >
          <CalendarDays size={14} className="shrink-0 text-muted-foreground" />
          <span className="truncate">{displayValue ?? placeholder}</span>
        </button>
      </PopoverTrigger>

      <PopoverPortal>
        <PopoverContent
          align="start"
          sideOffset={4}
          className="z-50 rounded-lg border border-border bg-surface p-0 shadow-card"
        >
          <div className="flex">
            {/* Presets sidebar */}
            {presets.length > 0 && (
              <div className="flex flex-col gap-1 border-r border-border p-3">
                {presets.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handlePresetClick(preset)}
                    className="whitespace-nowrap rounded-md px-3 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            )}

            {/* Calendar */}
            <div className="p-3">
              <Calendar
                mode="range"
                selected={selected}
                onSelect={handleCalendarSelect}
              />
            </div>
          </div>
        </PopoverContent>
      </PopoverPortal>
    </Popover>
  );
};
