import type { Meta, StoryObj } from '@storybook/react';

import { Badge } from '#shared/ui/Badge';
import { Button } from '#shared/ui/Button';
import { Card, CardHeader } from '#shared/ui/Card';

const meta: Meta<typeof Card> = {
  title: 'shared/ui/Card',
  component: Card,
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Showcase: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <section>
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">
          With header + action
        </h3>
        <Card>
          <CardHeader
            title="Budżety"
            action={
              <Button variant="ghost" size="sm">
                Zarządzaj
              </Button>
            }
          />
          <p className="text-sm text-muted-foreground">Zawartość karty</p>
        </Card>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">
          KPI card
        </h3>
        <div className="w-72">
          <Card>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Wydatki · czerwiec
              </span>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-expense-soft text-expense">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 5v14M5 12l7 7 7-7" />
                </svg>
              </span>
            </div>
            <div className="mt-3 font-mono text-2xl font-semibold tabular-nums tracking-tight">
              6 240,18 zł
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Badge color="expense" variant="soft" dot={false}>
                +7,6%
              </Badge>
              <span className="text-xs text-subtle">vs poprzedni mies.</span>
            </div>
          </Card>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">
          With subtitle + placeholder content
        </h3>
        <Card>
          <CardHeader
            title="Przychody vs wydatki"
            subtitle="Ostatnie 6 miesięcy"
          />
          <div className="h-40 rounded-md bg-surface-2" />
        </Card>
      </section>
    </div>
  ),
};
