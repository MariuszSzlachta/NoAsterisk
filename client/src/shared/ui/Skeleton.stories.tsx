import type { Meta, StoryObj } from '@storybook/react';

import { Card } from '#shared/ui/Card';
import { Skeleton } from '#shared/ui/Skeleton';

const meta: Meta<typeof Skeleton> = {
  title: 'shared/ui/Skeleton',
  component: Skeleton,
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

export const Default: Story = {
  args: { className: 'h-4 w-48' },
};

export const TransactionRow: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Skeleton className="h-9 w-9 rounded-lg" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-3 w-16" />
    </div>
  ),
};

export const CardLoading: Story = {
  render: () => (
    <div className="w-72">
      <Card>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-3 w-20" />
        </div>
      </Card>
    </div>
  ),
};

export const TableLoading: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-3 flex-1" />
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  ),
};
