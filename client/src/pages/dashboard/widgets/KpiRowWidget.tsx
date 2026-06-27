import { DollarSign, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import type { ReactNode } from 'react';

import { KpiCard } from '#shared/ui/KpiCard';

interface KpiItem {
  readonly label: string;
  readonly value: string;
  readonly icon: ReactNode;
  readonly delta?: string;
  readonly trend?: 'up' | 'down' | 'neutral';
}

const useKpiData = (): KpiItem[] => [
  { label: 'Saldo', value: '12 450,00 zł', icon: <Wallet size={16} />, delta: '+2,4%', trend: 'up' },
  { label: 'Przychody', value: '8 500,00 zł', icon: <TrendingUp size={16} />, delta: '+12%', trend: 'up' },
  { label: 'Wydatki', value: '6 050,00 zł', icon: <TrendingDown size={16} />, delta: '+5,3%', trend: 'down' },
  { label: 'Oszczędności', value: '2 450,00 zł', icon: <DollarSign size={16} /> },
];

export const KpiRowWidget = (): React.JSX.Element => {
  const items = useKpiData();

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {items.map((item) => (
        <KpiCard key={item.label} {...item} />
      ))}
    </div>
  );
};
