import { useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { FileClock, History, Trash2 } from 'lucide-react';

import { formatImportHistoryDate } from '#features/csv-import/model/history/format-import-history-date';
import { useImportHistory } from '#features/csv-import/ui/hooks/useImportHistory';
import { ImportHistoryDeleteDialog } from '#features/csv-import/ui/ImportHistoryDeleteDialog';
import { encryptedPersistence } from '#shared/adapters/persistence';
import { useActionFactory } from '#shared/hooks/useActionFactory';
import { Badge } from '#shared/ui/Badge';
import { Button } from '#shared/ui/Button';
import { Card } from '#shared/ui/Card';
import { Skeleton } from '#shared/ui/Skeleton';

export const ImportHistoryPage = (): React.JSX.Element => {
  const { t, i18n } = useTranslation();
  const persistenceSnapshot = useSyncExternalStore(
    encryptedPersistence.subscribe,
    encryptedPersistence.getSnapshot,
    encryptedPersistence.getSnapshot,
  );
  const {
    history,
    pendingDelete,
    isDeleting,
    error,
    requestDelete,
    cancelDelete,
    confirmDelete,
  } = useImportHistory();
  const { createActionHandler: createRequestDeleteHandler } =
    useActionFactory(requestDelete);

  if (persistenceSnapshot.status === 'unlocking') {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (persistenceSnapshot.status === 'error') {
    return (
      <Card className="gap-2 border-expense/30">
        <h1 className="text-base font-semibold text-expense">
          {t('importHistory.error.title')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {persistenceSnapshot.error ?? t('importHistory.error.description')}
        </p>
      </Card>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-screen-xl flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            {t('importHistory.title')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('importHistory.description')}
          </p>
        </div>
        <Link
          to="/import"
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-transparent bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <FileClock size={16} aria-hidden="true" />
          {t('importHistory.importMore')}
        </Link>
      </div>

      {error !== undefined && (
        <div
          className="rounded-lg border border-expense/30 bg-expense-soft px-4 py-3 text-sm text-expense"
          role="alert"
        >
          {error}
        </div>
      )}

      {history.length === 0 ? (
        <Card className="items-center justify-center gap-3 py-16 text-center">
          <History
            size={32}
            className="text-muted-foreground"
            aria-hidden="true"
          />
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-semibold text-foreground">
              {t('importHistory.empty.title')}
            </h2>
            <p className="max-w-md text-sm text-muted-foreground">
              {t('importHistory.empty.description')}
            </p>
          </div>
          <Link
            to="/import"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border-strong bg-surface px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface-2"
          >
            {t('importHistory.empty.action')}
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {history.map((record) => (
            <Card key={record.batchId} className="gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-1">
                  <h2
                    className="truncate text-sm font-semibold text-foreground"
                    title={record.fileName}
                  >
                    {record.fileName}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {t('importHistory.completedAt', {
                      date: formatImportHistoryDate(
                        record.completedAt,
                        i18n.language,
                      ),
                    })}
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  aria-label={t('importHistory.delete', {
                    fileName: record.fileName,
                  })}
                  onClick={createRequestDeleteHandler(record)}
                >
                  <Trash2 size={16} aria-hidden="true" />
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-2 border-t border-border pt-3">
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="text-[11px] text-muted-foreground">
                    {t('importHistory.stats.accepted')}
                  </span>
                  <Badge
                    color="income"
                    dot={false}
                    className="w-fit font-mono tabular-nums"
                  >
                    {record.acceptedCount}
                  </Badge>
                </div>
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="text-[11px] text-muted-foreground">
                    {t('importHistory.stats.duplicates')}
                  </span>
                  <Badge
                    color="neutral"
                    dot={false}
                    className="w-fit font-mono tabular-nums"
                  >
                    {record.duplicateCount}
                  </Badge>
                </div>
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="text-[11px] text-muted-foreground">
                    {t('importHistory.stats.rejected')}
                  </span>
                  <Badge
                    color="warning"
                    dot={false}
                    className="w-fit font-mono tabular-nums"
                  >
                    {record.rejectedCount}
                  </Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {pendingDelete !== undefined && (
        <ImportHistoryDeleteDialog
          record={pendingDelete}
          isDeleting={isDeleting}
          onCancel={cancelDelete}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
};
