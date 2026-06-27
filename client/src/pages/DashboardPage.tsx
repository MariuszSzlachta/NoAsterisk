import { WIDGET_REGISTRY } from '#features/dashboard-widgets';

export const DashboardPage = (): React.JSX.Element => {
  const fullWidth = WIDGET_REGISTRY.filter((w) => w.cols === 4);
  const halfWidth = WIDGET_REGISTRY.filter((w) => w.cols === 2);

  return (
    <div className="flex flex-col gap-6">
      {fullWidth.map((widget) => (
        <widget.Component key={widget.id} />
      ))}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {halfWidth.map((widget) => (
          <widget.Component key={widget.id} />
        ))}
      </div>
    </div>
  );
};
