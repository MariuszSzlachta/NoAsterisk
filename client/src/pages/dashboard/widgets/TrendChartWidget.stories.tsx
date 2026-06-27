import type { Meta, StoryObj } from '@storybook/react';

import { TrendChartWidget } from '#pages/dashboard/widgets/TrendChartWidget';

const meta: Meta<typeof TrendChartWidget> = {
  title: 'pages/dashboard/TrendChartWidget',
  component: TrendChartWidget,
};

export default meta;
type Story = StoryObj<typeof TrendChartWidget>;

export const Showcase: Story = {
  render: () => (
    <div className="max-w-2xl">
      <TrendChartWidget />
    </div>
  ),
};
