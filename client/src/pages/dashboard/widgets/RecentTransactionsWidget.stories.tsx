import type { Meta, StoryObj } from '@storybook/react';

import { RecentTransactionsWidget } from '#pages/dashboard/widgets/RecentTransactionsWidget';

const meta: Meta<typeof RecentTransactionsWidget> = {
  title: 'pages/dashboard/RecentTransactionsWidget',
  component: RecentTransactionsWidget,
};

export default meta;
type Story = StoryObj<typeof RecentTransactionsWidget>;

export const Showcase: Story = {
  render: () => (
    <div className="max-w-md">
      <RecentTransactionsWidget />
    </div>
  ),
};
