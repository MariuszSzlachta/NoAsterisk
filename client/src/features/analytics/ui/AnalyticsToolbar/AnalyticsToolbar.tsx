import { SlidersHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { AnalyticsFilters } from '#features/analytics/model/types';
import { Button } from '#shared/ui/Button';
import { Modal } from '#shared/ui/Modal';

import { AnalyticsFilterControls } from '../AnalyticsFilterControls';
import { useAnalyticsMobileFilters } from '../hooks/useAnalyticsMobileFilters';

interface AnalyticsToolbarProps {
  readonly filters: AnalyticsFilters;
  readonly onFiltersChange: (filters: AnalyticsFilters) => void;
}

export const AnalyticsToolbar = ({
  filters,
  onFiltersChange,
}: AnalyticsToolbarProps): React.JSX.Element => {
  const { t } = useTranslation();
  const {
    isOpen,
    draftFilters,
    open,
    cancel,
    apply,
    setDraftFilters,
  } = useAnalyticsMobileFilters(filters, onFiltersChange);

  return (
    <>
      <div className="hidden lg:block">
        <AnalyticsFilterControls
          filters={filters}
          onFiltersChange={onFiltersChange}
          variant="desktop"
        />
      </div>

      <div className="lg:hidden">
        <Button
          type="button"
          variant="secondary"
          size="md"
          icon={<SlidersHorizontal size={16} />}
          onClick={open}
          className="min-h-12 w-full justify-between px-4"
        >
          <span>{t('analytics.filters.open')}</span>
          <span className="text-xs text-muted-foreground">
            {t('analytics.filters.selectedMetrics', { count: filters.metrics.length })}
          </span>
        </Button>
      </div>

      <Modal
        isOpen={isOpen}
        placement="bottom"
        title={t('analytics.filters.title')}
        closeLabel={t('analytics.filters.cancel')}
        onClose={cancel}
        className="max-h-[90dvh] overflow-y-auto !rounded-b-none sm:!rounded-lg"
      >
        <AnalyticsFilterControls
          filters={draftFilters}
          onFiltersChange={setDraftFilters}
          variant="mobile"
        />
        <div className="sticky bottom-0 mt-6 flex gap-3 border-t border-border bg-surface pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={cancel}
            className="min-h-12 flex-1"
          >
            {t('analytics.filters.cancel')}
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={apply}
            className="min-h-12 flex-1"
          >
            {t('analytics.filters.apply')}
          </Button>
        </div>
      </Modal>
    </>
  );
};
