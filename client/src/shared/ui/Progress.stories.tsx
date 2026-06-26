import type { Meta, StoryObj } from '@storybook/react';

import { Progress } from '#shared/ui/Progress';

const meta: Meta<typeof Progress> = {
  title: 'shared/ui/Progress',
  component: Progress,
  argTypes: {
    color: { control: 'select', options: ['primary', 'income', 'expense', 'warning'] },
  },
};

export default meta;
type Story = StoryObj<typeof Progress>;

export const Default: Story = { args: { value: 65 } };
export const Full: Story = { args: { value: 100, color: 'income' } };
export const OverBudget: Story = { args: { value: 113, max: 100, color: 'expense' } };
export const Warning: Story = { args: { value: 92, color: 'warning' } };

export const BudgetBars: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-4">
      <div>
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="font-medium text-foreground">Zakupy spożywcze</span>
          <span className="font-mono text-muted-foreground tabular-nums">1 820 / 2 000 zł</span>
        </div>
        <Progress value={1820} max={2000} color="income" />
      </div>
      <div>
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="font-medium text-foreground">Transport</span>
          <span className="font-mono text-muted-foreground tabular-nums">1 140 / 1 200 zł</span>
        </div>
        <Progress value={1140} max={1200} color="warning" />
      </div>
      <div>
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="font-medium text-foreground">Jedzenie na mieście</span>
          <span className="font-mono text-muted-foreground tabular-nums">680 / 600 zł</span>
        </div>
        <Progress value={680} max={600} color="expense" />
      </div>
    </div>
  ),
};
