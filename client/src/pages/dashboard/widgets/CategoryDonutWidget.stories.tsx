import type { Meta, StoryObj } from '@storybook/react';

import { CategoryDonutWidget } from '#pages/dashboard/widgets/CategoryDonutWidget';

const meta: Meta<typeof CategoryDonutWidget> = {
  title: 'pages/dashboard/CategoryDonutWidget',
  component: CategoryDonutWidget,
};

export default meta;
type Story = StoryObj<typeof CategoryDonutWidget>;

export const Showcase: Story = {
  render: () => (
    <div className="max-w-md">
      <CategoryDonutWidget />
    </div>
  ),
};
