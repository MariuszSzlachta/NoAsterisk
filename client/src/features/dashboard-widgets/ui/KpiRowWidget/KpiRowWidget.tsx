import type { KpiItemVM } from '#features/dashboard-widgets/model/types';
import { KpiCard } from '#shared/ui/KpiCard';

interface KpiRowWidgetProps {
  readonly items: KpiItemVM[];
}

export const KpiRowWidget = ({
  items,
}: KpiRowWidgetProps): React.JSX.Element => (
  <div className="grid grid-cols-1 gap-3 lg:grid-cols-4 lg:gap-4 [&_.kpi-label]:text-sm lg:[&_.kpi-label]:text-xs">
    {items.map((item) => (
      <KpiCard key={item.label} {...item} />
    ))}
  </div>
);
