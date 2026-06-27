import type { Meta, StoryObj } from '@storybook/react';

import { Badge } from '#shared/ui/Badge';

const meta: Meta<typeof Badge> = {
  title: 'shared/ui/Badge',
  component: Badge,
  argTypes: {
    variant: { control: 'select', options: ['soft', 'solid', 'outline'] },
    color: {
      control: 'select',
      options: [
        'primary',
        'income',
        'expense',
        'warning',
        'neutral',
        'purple',
        'blue',
        'amber',
      ],
    },
    dot: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Showcase: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <section>
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">
          Soft (default)
        </h3>
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
      </section>

      <section>
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">
          Solid
        </h3>
        <div className="flex flex-wrap gap-2">
          <Badge color="income" variant="solid">
            Income
          </Badge>
          <Badge color="blue" variant="solid">
            Blue
          </Badge>
          <Badge color="expense" variant="solid">
            Expense
          </Badge>
          <Badge color="purple" variant="solid">
            Purple
          </Badge>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">
          Outline
        </h3>
        <div className="flex flex-wrap gap-2">
          <Badge color="income" variant="outline">
            Income
          </Badge>
          <Badge color="blue" variant="outline">
            Blue
          </Badge>
          <Badge color="expense" variant="outline">
            Expense
          </Badge>
          <Badge color="warning" variant="outline">
            Warning
          </Badge>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">
          Without dot
        </h3>
        <div className="flex flex-wrap gap-2">
          <Badge color="neutral" dot={false}>
            Status
          </Badge>
          <Badge color="primary" dot={false}>
            +7,6%
          </Badge>
        </div>
      </section>
    </div>
  ),
};
