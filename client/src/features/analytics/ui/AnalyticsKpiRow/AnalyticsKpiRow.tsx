import { useTranslation } from 'react-i18next';

import { getTrendClass } from '#features/analytics/model/getTrendClass';
import type { AnalyticsKpi } from '#features/analytics/model/types';
import { Card } from '#shared/ui/Card';

const VALUE_TONE_CLASS = {
  income: 'text-income',
  expense: 'text-expense',
  neutral: 'text-muted-foreground',
};

interface AnalyticsKpiRowProps {
  readonly kpis: AnalyticsKpi[];
}

export const AnalyticsKpiRow = ({
  kpis,
}: AnalyticsKpiRowProps): React.JSX.Element => {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => (
        <Card key={kpi.label} className="!p-4">
          <div className="flex flex-col gap-1">
            <span className="kpi-label text-sm font-medium text-muted-foreground lg:text-xs">
              {t(kpi.label)}
            </span>
            <span
              className={`font-mono text-lg font-semibold tabular-nums ${VALUE_TONE_CLASS[kpi.valueTone]}`}
            >
              {kpi.value}
            </span>
            {kpi.delta && (
              <span
                className={`text-xs font-medium ${getTrendClass(kpi.trend, kpi.invertColor)}`}
              >
                {kpi.delta} {t('analytics.kpi.vsPreviousPeriod')}
              </span>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
};
