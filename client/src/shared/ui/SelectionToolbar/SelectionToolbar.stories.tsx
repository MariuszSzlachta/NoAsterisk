import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { SelectionToolbar } from '#shared/ui/SelectionToolbar';

const noop = (): void => {};

const meta: Meta = {
  title: 'shared/ui/SelectionToolbar',
};

export default meta;
type Story = StoryObj;

const ShowcaseRender = (): React.JSX.Element => {
  const [count, setCount] = useState(3);

  return (
    <div className="flex flex-col items-center gap-4 p-8">
      <div className="flex gap-2">
        <button
          className="rounded-md bg-surface-3 px-3 py-1.5 text-xs text-foreground"
          onClick={() => setCount((c) => c + 1)}
        >
          + Zaznacz
        </button>
        <button
          className="rounded-md bg-surface-3 px-3 py-1.5 text-xs text-foreground"
          onClick={() => setCount(0)}
        >
          Wyczyść
        </button>
      </div>
      <p className="text-xs text-muted-foreground">Zaznaczono: {count}</p>
      <SelectionToolbar
        count={count}
        onClear={() => setCount(0)}
        actions={[
          { label: 'Zmień kategorię', onClick: noop },
          { label: 'Eksportuj', onClick: noop },
          { label: 'Archiwizuj', onClick: noop, disabled: true },
          { label: 'Usuń', onClick: noop, variant: 'danger' },
        ]}
      />
    </div>
  );
};

export const Showcase: Story = {
  render: () => <ShowcaseRender />,
};
