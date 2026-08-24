import type { CategoryBreakdownItem } from '#features/analytics/model/types';
import { Button } from '#shared/ui/Button';

interface BreakdownListItemProps {
  readonly item: CategoryBreakdownItem;
  readonly color: string;
  readonly maxAmount: number;
  readonly isSelected: boolean;
  readonly drilldownId: string;
  readonly onClick: () => void;
}

export const BreakdownListItem = ({
  item,
  color,
  maxAmount,
  isSelected,
  drilldownId,
  onClick,
}: BreakdownListItemProps): React.JSX.Element => {
  // Progress bar width is relative to the largest category — the top category fills 100%.
  const barWidth = maxAmount > 0 ? (item.amount / maxAmount) * 100 : 0;

  return (
    <li>
      <Button
        variant="ghost"
        size="sm"
        onClick={onClick}
        aria-expanded={isSelected}
        aria-controls={isSelected ? drilldownId : undefined}
        className={`w-full flex-col items-stretch gap-1.5 ${isSelected ? 'bg-surface-2' : ''}`}
      >
        <span className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="text-sm text-foreground">{item.category}</span>
          </span>
          <span className="flex items-center gap-3">
            <span className="font-mono text-sm tabular-nums text-foreground">
              {item.amount.toLocaleString('pl-PL')} zł
            </span>
            <span className="w-10 text-right text-xs text-muted-foreground">
              {item.percentage}%
            </span>
          </span>
        </span>
        <span className="h-2 w-full overflow-hidden rounded-full bg-surface-3">
          <span
            className="block h-full rounded-full transition-all duration-300"
            style={{ width: `${barWidth}%`, backgroundColor: color }}
          />
        </span>
      </Button>
    </li>
  );
};
