import type { Meta, StoryObj } from '@storybook/react';

import type { QueryState } from '#shared/api';
import { Skeleton } from '#shared/ui/Skeleton';

import { QueryRenderer } from './QueryRenderer';

const meta: Meta<typeof QueryRenderer> = {
  title: 'shared/ui/QueryRenderer',
  component: QueryRenderer,
};

export default meta;
type Story = StoryObj<typeof QueryRenderer>;

const SampleWidget = ({ items }: { items: string[] }): React.JSX.Element => (
  <div className="rounded-lg bg-surface p-4">
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <li key={item} className="text-sm text-foreground">
          {item}
        </li>
      ))}
    </ul>
  </div>
);

export const Loading: Story = {
  render: () => {
    const state: QueryState<string[]> = { status: 'loading' };
    return (
      <QueryRenderer state={state}>
        {(data) => <SampleWidget items={data} />}
      </QueryRenderer>
    );
  },
};

export const Error: Story = {
  render: () => {
    const state: QueryState<string[]> = {
      status: 'error',
      error: 'Nie udało się pobrać danych.',
    };
    return (
      <QueryRenderer state={state}>
        {(data) => <SampleWidget items={data} />}
      </QueryRenderer>
    );
  },
};

export const Loaded: Story = {
  render: () => {
    const state: QueryState<string[]> = {
      status: 'loaded',
      data: ['BIEDRONKA', 'SPOTIFY', 'UBER'],
    };
    return (
      <QueryRenderer state={state}>
        {(data) => <SampleWidget items={data} />}
      </QueryRenderer>
    );
  },
};

export const CustomSkeleton: Story = {
  render: () => {
    const state: QueryState<string[]> = { status: 'loading' };
    return (
      <QueryRenderer
        state={state}
        skeleton={<Skeleton className="h-24 w-full" />}
      >
        {(data) => <SampleWidget items={data} />}
      </QueryRenderer>
    );
  },
};
