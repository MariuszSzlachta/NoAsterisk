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
    <div className="flex h-full flex-col gap-4 overflow-hidden">
      {fullWidth.map((widget) => (
        <widget.Component key={widget.id} />
      ))}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-4 lg:grid-rows-[1.5fr_1.5fr_1.3fr]">
        {gridWidgets.map((widget) => (
          <div
            key={widget.id}
            className={`min-h-0 overflow-hidden ${COL_SPAN[widget.cols]}`}
          >
            <widget.Component />
          </div>
        ))}
      </div>
    </div>
  );
};
