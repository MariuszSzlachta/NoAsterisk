import { useTranslation } from 'react-i18next';

import { Skeleton } from '#shared/ui/Skeleton';

const NAVIGATION_ITEMS = [
  { id: 'dashboard', width: 'w-28' },
  { id: 'transactions', width: 'w-32' },
  { id: 'import', width: 'w-24' },
  { id: 'budgets', width: 'w-28' },
  { id: 'analytics', width: 'w-24' },
  { id: 'rules', width: 'w-20' },
] as const;

export const AppShellSkeleton = (): React.JSX.Element => {
  const { t } = useTranslation();

  return (
    <div
      className="flex h-screen w-full"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">{t('common.loading')}</span>

      <aside
        className="hidden h-screen w-[236px] flex-shrink-0 flex-col border-r border-border bg-surface lg:flex"
        aria-hidden="true"
      >
        <Skeleton className="mx-6 mt-6 h-8 w-32" />

        <div className="flex flex-col gap-3 px-6 pt-10">
          {NAVIGATION_ITEMS.map(({ id, width }) => (
            <Skeleton key={id} className={`h-9 ${width}`} />
          ))}
        </div>

        <Skeleton className="mx-6 mb-6 mt-auto h-10 w-[188px]" />
      </aside>

      <main className="flex max-h-screen min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center gap-4 border-b border-border bg-background px-4 lg:h-[60px] lg:px-6">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-6 w-36" />
          <div className="ml-auto flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-md" />
            <Skeleton className="h-9 w-9 rounded-md" />
            <Skeleton className="h-9 w-9 rounded-full" />
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-4 lg:p-6">
          <Skeleton className="h-8 w-48" />

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>

          <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
            <Skeleton className="min-h-[280px] w-full" />
            <Skeleton className="min-h-[280px] w-full" />
          </div>
        </div>
      </main>
    </div>
  );
};
