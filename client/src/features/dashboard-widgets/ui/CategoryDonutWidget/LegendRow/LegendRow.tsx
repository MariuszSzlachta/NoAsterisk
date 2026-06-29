import type { LegendItem } from '#features/dashboard-widgets/ui/CategoryDonutWidget/useCategoryLegend';

interface LegendRowProps {
  readonly item: LegendItem;
}

export const LegendRow = ({ item }: LegendRowProps): React.JSX.Element => (
  <li className="flex items-center gap-2 py-0.5" title={item.label}>
    <span
      className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
      style={{ backgroundColor: item.color }}
    />
    <span className="text-sm text-foreground">{item.label}</span>
    <span className="text-sm tabular-nums text-muted-foreground">
      {item.percent}%
    </span>
  </li>
);
