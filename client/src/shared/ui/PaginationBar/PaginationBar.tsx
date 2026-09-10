import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Select } from '#shared/ui/Select';

const PAGE_SIZE_OPTIONS = [
  { value: '25', label: '25' },
  { value: '50', label: '50' },
  { value: '100', label: '100' },
] as const;

interface PaginationBarProps {
  readonly currentPage: number;
  readonly totalPages: number;
  readonly totalRows: number;
  readonly pageSize: number;
  readonly onPageChange: (page: number) => void;
  readonly onPageSizeChange: (size: number) => void;
  readonly className?: string;
}

export const PaginationBar = ({
  currentPage,
  totalPages,
  totalRows,
  pageSize,
  onPageChange,
  onPageSizeChange,
  className = '',
}: PaginationBarProps): React.JSX.Element => {
  const { t } = useTranslation();
  const rangeStart = (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, totalRows);

  const handlePrev = (): void => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = (): void => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePageSizeChange = (value: string): void => {
    onPageSizeChange(Number(value));
  };

  return (
    <div className={`flex items-center justify-between border-t border-border bg-surface-2 px-4 py-2 ${className}`}>
      <span className="text-xs text-muted-foreground">
        {t('pagination.range', { start: rangeStart, end: rangeEnd, total: totalRows })}
      </span>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">{t('pagination.rowsPerPage')}</span>
          <Select
            options={[...PAGE_SIZE_OPTIONS]}
            value={String(pageSize)}
            onChange={handlePageSizeChange}
            className="h-7 w-16 text-xs"
          />
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={handlePrev}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-3 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={t('pagination.prevPage')}
          >
            <ChevronLeft size={14} />
          </button>

          <span className="min-w-[3rem] text-center text-xs text-foreground">
            {currentPage} / {totalPages}
          </span>

          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={handleNext}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-3 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={t('pagination.nextPage')}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
