import type { Meta, StoryObj } from '@storybook/react';

import { BudgetProgressList } from '#shared/ui/BudgetProgressList';
import { Card, CardHeader } from '#shared/ui/Card';

const meta: Meta<typeof BudgetProgressList> = {
  title: 'shared/ui/BudgetProgressList',
  component: BudgetProgressList,
};

export default meta;
type Story = StoryObj<typeof BudgetProgressList>;

const BUDGET_ITEMS = [
  { label: 'Zakupy spożywcze', spent: 1820, limit: 2000, color: 'var(--cat-groceries)' },
  { label: 'Transport', spent: 1140, limit: 1200, color: 'var(--cat-transport)' },
  { label: 'Jedzenie na mieście', spent: 680, limit: 600, color: 'var(--cat-dining)' },
  { label: 'Rozrywka', spent: 600, limit: 800, color: 'var(--cat-entertainment)' },
  { label: 'Subskrypcje', spent: 540, limit: 600, color: 'var(--cat-subscriptions)' },
];

export const Default: Story = {
  render: () => (
    <Card className="w-[600px]">
      <CardHeader
        title="Budżety"
        action={<span className="cursor-pointer text-sm text-primary">Zarządzaj</span>}
      />
      <BudgetProgressList items={BUDGET_ITEMS} />
    </Card>
  ),
};

export const AllUnderBudget: Story = {
  render: () => (
    <Card className="w-[600px]">
      <CardHeader title="Budżety" subtitle="Wszystko w normie" />
      <BudgetProgressList
        items={[
          { label: 'Zakupy spożywcze', spent: 800, limit: 2000, color: 'var(--cat-groceries)' },
          { label: 'Transport', spent: 400, limit: 1200, color: 'var(--cat-transport)' },
          { label: 'Rozrywka', spent: 200, limit: 800, color: 'var(--cat-entertainment)' },
        ]}
      />
    </Card>
  ),
};
