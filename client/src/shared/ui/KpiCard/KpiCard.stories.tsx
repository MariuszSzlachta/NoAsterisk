import { DollarSign, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import type { Meta, StoryObj } from '@storybook/react';

import { KpiCard } from '#shared/ui/KpiCard/KpiCard';

const meta: Meta<typeof KpiCard> = {
  title: 'shared/ui/KpiCard',
  component: KpiCard,
};

export default meta;
type Story = StoryObj<typeof KpiCard>;

export const Showcase: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <KpiCard
        label="Saldo"
        value="12 450,00 zł"
        icon={<Wallet size={16} />}
        delta="+2,4% vs prev month"
        trend="up"
        tooltip="Suma wszystkich środków na kontach."
      />
      <KpiCard
        label="Przychody"
        value="8 500,00 zł"
        icon={<TrendingUp size={16} />}
        delta="+12%"
        trend="up"
        tooltip="Łączne wpływy w bieżącym miesiącu."
      />
      <KpiCard
        label="Wydatki"
        value="6 050,00 zł"
        icon={<TrendingDown size={16} />}
        delta="+5,3%"
        trend="down"
        tooltip="Suma wydatków w bieżącym miesiącu."
      />
      <KpiCard
        label="Oszczędności"
        value="2 450,00 zł"
        icon={<DollarSign size={16} />}
      />
    </div>
  ),
};

export const WithoutTooltip: Story = {
  args: {
    label: 'Saldo',
    value: '12 450,00 zł',
    icon: <Wallet size={16} />,
    delta: '+2,4%',
    trend: 'up',
  },
};

export const WithTooltip: Story = {
  args: {
    label: 'Saldo',
    value: '12 450,00 zł',
    icon: <Wallet size={16} />,
    delta: '+2,4%',
    trend: 'up',
    tooltip: 'Suma wszystkich środków na kontach. Zmiana procentowa vs poprzedni miesiąc.',
  },
};
