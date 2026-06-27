import type { Meta, StoryObj } from '@storybook/react';

import { BudgetProgressList } from '#shared/ui/BudgetProgressList';
import { Card, CardHeader } from '#shared/ui/Card';

const meta: Meta<typeof BudgetProgressList> = {
  title: 'shared/ui/BudgetProgressList',
  component: BudgetProgressList,
};

export default meta;
type Story = StoryObj<typeof BudgetProgressList>;

export const Showcase: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <section>
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">Mixed status</h3>
        <Card className="w-[600px]">
          <CardHeader
            title="Budżety"
            action={<span className="cursor-pointer text-sm text-primary">Zarządzaj</span>}
          />
          <BudgetProgressList
            items={[
              { label: 'Zakupy spożywcze', spent: 1820, limit: 2000, color: 'var(--cat-groceries)' },
              { label: 'Transport', spent: 1140, limit: 1200, color: 'var(--cat-transport)' },
              { label: 'Jedzenie na mieście', spent: 680, limit: 600, color: 'var(--cat-dining)' },
              { label: 'Rozrywka', spent: 600, limit: 800, color: 'var(--cat-entertainment)' },
              { label: 'Subskrypcje', spent: 540, limit: 600, color: 'var(--cat-subscriptions)' },
            ]}
          />
        </Card>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">All under budget</h3>
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
      </section>
    </div>
  ),
};
