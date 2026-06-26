import type { Meta, StoryObj } from '@storybook/react';

import { Badge } from '#shared/ui/Badge';

const meta: Meta<typeof Badge> = {
  title: 'shared/ui/Badge',
  component: Badge,
  argTypes: {
    variant: { control: 'select', options: ['soft', 'solid', 'outline'] },
    color: { control: 'select', options: ['primary', 'income', 'expense', 'warning', 'neutral', 'purple', 'blue', 'amber'] },
    dot: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Soft: Story = { args: { children: 'Zakupy', color: 'income', variant: 'soft' } };
export const Solid: Story = { args: { children: 'Transport', color: 'blue', variant: 'solid' } };
export const Outline: Story = { args: { children: 'Oczekuje', color: 'warning', variant: 'outline' } };
export const NoDot: Story = { args: { children: 'Status', color: 'neutral', dot: false } };

export const AllColors: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <Badge color="income">Zakupy</Badge>
        <Badge color="blue">Transport</Badge>
        <Badge color="purple">Subskrypcje</Badge>
        <Badge color="amber">Jedzenie</Badge>
        <Badge color="neutral">Rachunki</Badge>
        <Badge color="expense">Rozrywka</Badge>
        <Badge color="primary">Przychód</Badge>
        <Badge color="warning">Oczekuje</Badge>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge color="income" variant="solid">Solid</Badge>
        <Badge color="blue" variant="solid">Solid</Badge>
        <Badge color="expense" variant="solid">Solid</Badge>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge color="income" variant="outline">Outline</Badge>
        <Badge color="blue" variant="outline">Outline</Badge>
        <Badge color="expense" variant="outline">Outline</Badge>
      </div>
    </div>
  ),
};
