import type { ReactNode } from 'react';

import { Badge } from '#shared/ui/Badge';

type DeltaTrend = 'up' | 'down' | 'neutral';

interface KpiCardProps {
  readonly label: string;
  readonly value: string;
  readonly icon: ReactNode;
  readonly delta?: string;
  readonly trend?: DeltaTrend;
}

const TREND_COLOR: Record<DeltaTrend, 'income' | 'expense' | 'neutral'> = {
  up: 'income',
  down: 'expense',
  neutral: 'neutral',
};

export const KpiCard = ({ label, value, icon, delta, trend = 'neutral' }: KpiCardProps): React.JSX.Element => (
  <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4 shadow-card">
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="text-muted-foreground">{icon}</span>
    </div>
    <span className="font-mono text-xl font-semibold tabular-nums text-foreground">{value}</span>
    {delta && (
      <Badge variant="soft" color={TREND_COLOR[trend]} dot={false} className="w-fit">
        {delta}
      </Badge>
    )}
  </div>
);
