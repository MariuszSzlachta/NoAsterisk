import { WIDGET_REGISTRY } from '#features/dashboard-widgets';

const COL_SPAN: Record<number, string> = {
  1: 'lg:col-span-1',
  2: 'lg:col-span-2',
  3: 'lg:col-span-3',
};

export const DashboardPage = (): React.JSX.Element => {
  const fullWidth = WIDGET_REGISTRY.filter((w) => w.cols === 4);
  const gridWidgets = WIDGET_REGISTRY.filter((w) => w.cols < 4);

  return (
    <div className="flex flex-col gap-6">
      {fullWidth.map((widget) => (
        <widget.Component key={widget.id} />
      ))}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {gridWidgets.map((widget) => (
          <div key={widget.id} className={COL_SPAN[widget.cols]}>
            <widget.Component />
          </div>
        ))}
      </div>
    </div>
  );
};
