import type { KpiItemVM } from '#features/dashboard-widgets/model/types';
import { KpiCard } from '#shared/ui/KpiCard';

interface KpiRowWidgetProps {
  readonly items: KpiItemVM[];
}

export const KpiRowWidget = ({
  items,
}: KpiRowWidgetProps): React.JSX.Element => (
  <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
    {items.map((item) => (
      <KpiCard key={item.label} {...item} />
    ))}
  </div>
);
