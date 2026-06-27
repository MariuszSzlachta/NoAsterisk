import { useTranslation } from 'react-i18next';

export const SavingsReportPage = (): React.JSX.Element => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-foreground">{t('titles.reportSavings')}</h1>
      <p className="text-sm text-muted-foreground">{t('reports.savingsDescription')}</p>
    </div>
  );
};
