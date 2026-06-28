import type { SavingsRateVM } from '#features/dashboard-widgets/ui/hooks/useSavingsRateWidget/useSavingsRateWidget';
import { Card, CardHeader } from '#shared/ui/Card';

const RING_SIZE = 160;
const STROKE_WIDTH = 12;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface SavingsRateWidgetProps {
  readonly data: SavingsRateVM;
  readonly title: string;
  readonly subtitle?: string;
}

export const SavingsRateWidget = ({
  data,
  title,
  subtitle,
}: SavingsRateWidgetProps): React.JSX.Element => (
  <Card>
    <CardHeader title={title} subtitle={subtitle} />
    <div className="flex flex-1 flex-col items-center justify-center gap-3 pb-4">
      <div className="relative">
        <svg
          width={RING_SIZE}
          height={RING_SIZE}
          className="-rotate-90"
          aria-hidden="true"
        >
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="var(--border)"
            strokeWidth={STROKE_WIDTH}
          />
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={data.color}
            strokeWidth={STROKE_WIDTH}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={data.strokeOffset}
            strokeLinecap="round"
          />
        </svg>
        <span
          className="absolute inset-0 flex items-center justify-center font-mono text-2xl font-bold tabular-nums"
          style={{ color: data.color }}
        >
          {data.rate}%
        </span>
      </div>
      <span className="text-sm text-muted-foreground">
        {data.savedAmount} z {data.income}
      </span>
    </div>
  </Card>
);
