import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Info } from 'lucide-react';

import { Badge } from '#shared/ui/Badge';
import { Tooltip } from '#shared/ui/Tooltip';

type DeltaTrend = 'up' | 'down' | 'neutral';

interface KpiCardProps {
  readonly label: string;
  readonly value: string;
  readonly icon: ReactNode;
  readonly delta?: string;
  readonly trend?: DeltaTrend;
  readonly tooltip?: string;
  readonly iconHref?: string;
  readonly iconTooltip?: string;
}

const TREND_COLOR: Record<DeltaTrend, 'income' | 'expense' | 'neutral'> = {
  up: 'income',
  down: 'expense',
  neutral: 'neutral',
};

export const KpiCard = ({
  label,
  value,
  icon,
  delta,
  trend = 'neutral',
  tooltip,
  iconHref,
  iconTooltip,
}: KpiCardProps): React.JSX.Element => (
  <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4 shadow-card">
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
        {label}
        {tooltip && (
          <Tooltip content={tooltip}>
            <Info size={12} className="cursor-help text-subtle" />
          </Tooltip>
        )}
      </span>
      {iconHref ? (
        <Tooltip content={iconTooltip ?? 'Otwórz raport'}>
          <Link
            to={iconHref}
            className="rounded-sm text-muted-foreground transition-colors duration-150 hover:text-primary"
            aria-label={`${label} — raport szczegółowy`}
          >
            {icon}
          </Link>
        </Tooltip>
      ) : (
        <span className="text-muted-foreground">{icon}</span>
      )}
    </div>
    <span className="font-mono text-xl font-semibold tabular-nums text-foreground">
      {value}
    </span>
    {delta && (
      <div className="flex items-center gap-1.5">
        <Badge
          variant="soft"
          color={TREND_COLOR[trend]}
          dot={false}
          className="w-fit"
        >
          {delta}
        </Badge>
        <span className="text-xs text-muted-foreground">vs poprzedni miesiąc</span>
      </div>
    )}
  </div>
);
