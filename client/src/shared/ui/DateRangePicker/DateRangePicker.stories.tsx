import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import type { DateRange } from 'react-day-picker';

import { DateRangePicker } from '#shared/ui/DateRangePicker';

const meta: Meta<typeof DateRangePicker> = {
  title: 'shared/ui/DateRangePicker',
  component: DateRangePicker,
};

export default meta;
type Story = StoryObj<typeof DateRangePicker>;

export const Default: Story = {
  render: () => {
    const [selected, setSelected] = useState<DateRange | undefined>(undefined);

    return (
      <div className="flex flex-col gap-4">
        <section>
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">
            Domyślny (z presetami)
          </h3>
          <DateRangePicker selected={selected} onSelect={setSelected} />
          <p className="mt-2 text-xs text-muted-foreground">
            Od: {selected?.from?.toLocaleDateString('pl-PL') ?? '—'}
            {' → '}
            Do: {selected?.to?.toLocaleDateString('pl-PL') ?? '—'}
          </p>
        </section>
      </div>
    );
  },
};

export const WithSelection: Story = {
  render: () => {
    const [selected, setSelected] = useState<DateRange | undefined>({
      from: new Date(2026, 6, 1),
      to: new Date(2026, 6, 13),
    });

    return (
      <div className="flex flex-col gap-4">
        <section>
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">
            Z zaznaczonym zakresem
          </h3>
          <DateRangePicker selected={selected} onSelect={setSelected} />
        </section>
      </div>
    );
  },
};

export const CustomPlaceholder: Story = {
  render: () => {
    const [selected, setSelected] = useState<DateRange | undefined>(undefined);

    return (
      <div className="flex flex-col gap-4">
        <section>
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">
            Własny placeholder
          </h3>
          <DateRangePicker
            selected={selected}
            onSelect={setSelected}
            placeholder="Filtruj po dacie"
          />
        </section>
      </div>
    );
  },
};

export const NoPresets: Story = {
  render: () => {
    const [selected, setSelected] = useState<DateRange | undefined>(undefined);

    return (
      <div className="flex flex-col gap-4">
        <section>
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">
            Bez presetów
          </h3>
          <DateRangePicker selected={selected} onSelect={setSelected} presets={[]} />
        </section>
      </div>
    );
  },
};

export const Disabled: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <section>
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">
          Zablokowany
        </h3>
        <DateRangePicker onSelect={() => undefined} disabled />
      </section>
    </div>
  ),
};
