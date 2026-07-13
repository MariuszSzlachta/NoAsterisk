import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import type { DateRange } from 'react-day-picker';

import { Calendar } from '#shared/ui/Calendar';

const meta: Meta<typeof Calendar> = {
  title: 'shared/ui/Calendar',
  component: Calendar,
};

export default meta;
type Story = StoryObj<typeof Calendar>;

export const Single: Story = {
  render: () => {
    const [selected, setSelected] = useState<Date | undefined>(undefined);

    return (
      <div className="flex flex-col gap-4">
        <section>
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">
            Tryb pojedynczy (single)
          </h3>
          <div className="w-fit rounded-lg border border-border bg-surface p-3">
            <Calendar mode="single" selected={selected} onSelect={setSelected} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Wybrano: {selected ? selected.toLocaleDateString('pl-PL') : '—'}
          </p>
        </section>
      </div>
    );
  },
};

export const Range: Story = {
  render: () => {
    const [selected, setSelected] = useState<DateRange | undefined>(undefined);

    return (
      <div className="flex flex-col gap-4">
        <section>
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">
            Tryb zakresowy (range)
          </h3>
          <div className="w-fit rounded-lg border border-border bg-surface p-3">
            <Calendar mode="range" selected={selected} onSelect={setSelected} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Od: {selected?.from ? selected.from.toLocaleDateString('pl-PL') : '—'}
            {' → '}
            Do: {selected?.to ? selected.to.toLocaleDateString('pl-PL') : '—'}
          </p>
        </section>
      </div>
    );
  },
};

export const TwoMonths: Story = {
  render: () => {
    const [selected, setSelected] = useState<DateRange | undefined>(undefined);

    return (
      <div className="flex flex-col gap-4">
        <section>
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">
            Dwa miesiące (numberOfMonths=2)
          </h3>
          <div className="w-fit rounded-lg border border-border bg-surface p-3">
            <Calendar
              mode="range"
              selected={selected}
              onSelect={setSelected}
              numberOfMonths={2}
            />
          </div>
        </section>
      </div>
    );
  },
};

export const WithDisabledDates: Story = {
  render: () => {
    const [selected, setSelected] = useState<Date | undefined>(undefined);
    const today = new Date();
    const disableFuture = (date: Date): boolean => date > today;

    return (
      <div className="flex flex-col gap-4">
        <section>
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">
            Z zablokowanymi datami (przyszłość)
          </h3>
          <div className="w-fit rounded-lg border border-border bg-surface p-3">
            <Calendar
              mode="single"
              selected={selected}
              onSelect={setSelected}
              disabled={disableFuture}
            />
          </div>
        </section>
      </div>
    );
  },
};
