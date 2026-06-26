import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { SelectionToolbar } from '#shared/ui/SelectionToolbar';

const meta: Meta = {
  title: 'shared/ui/SelectionToolbar',
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => {
    const [count, setCount] = useState(3);

    return (
      <div className="flex flex-col items-center gap-4 p-8">
        <div className="flex gap-2">
          <button className="rounded-md bg-surface-3 px-3 py-1.5 text-xs text-foreground" onClick={() => setCount((c) => c + 1)}>
            + Zaznacz
          </button>
          <button className="rounded-md bg-surface-3 px-3 py-1.5 text-xs text-foreground" onClick={() => setCount(0)}>
            Wyczyść
          </button>
        </div>
        <p className="text-xs text-muted-foreground">Zaznaczono: {count}</p>
        <SelectionToolbar
          count={count}
          onClear={() => setCount(0)}
          actions={[
            { label: 'Zmień kategorię', onClick: () => console.log('category') },
            { label: 'Eksportuj', onClick: () => console.log('export') },
            { label: 'Archiwizuj', onClick: () => console.log('archive'), disabled: true },
            { label: 'Usuń', onClick: () => console.log('delete'), variant: 'danger' },
          ]}
        />
      </div>
    );
  },
};
