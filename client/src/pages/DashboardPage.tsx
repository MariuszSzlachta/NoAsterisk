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
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pb-6 lg:h-full lg:flex-none lg:gap-4 lg:overflow-hidden lg:pb-0">
      {fullWidth.map((widget) => (
        <widget.Component key={widget.id} />
      ))}
      <div className="grid flex-none grid-cols-1 gap-3 lg:min-h-0 lg:flex-1 lg:grid-cols-4 lg:gap-4 lg:grid-rows-[1.5fr_1.5fr_1.3fr]">
        {gridWidgets.map((widget) => (
          <div
            key={widget.id}
            className={`min-h-0 overflow-visible lg:overflow-hidden ${COL_SPAN[widget.cols]}`}
          >
            <widget.Component />
          </div>
        ))}
      </div>
    </div>
  );
};
