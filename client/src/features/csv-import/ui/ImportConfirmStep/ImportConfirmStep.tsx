import { useTranslation } from 'react-i18next';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

import { useImportSubmit } from '#features/csv-import/ui/hooks/useImportSubmit';
import { useImportWizard } from '#features/csv-import/ui/hooks/useImportWizard';
import { IMPORT_PROGRESS_STATUS } from '#features/csv-import/model/persistence';
import { IMPORT_CONFIRM_LAYOUT } from '#features/csv-import/ui/ImportConfirmStep/constants/import-confirm-layout';
import { Button } from '#shared/ui/Button';
import { Card } from '#shared/ui/Card';
import { Progress } from '#shared/ui/Progress';

export const ImportConfirmStep = (): React.JSX.Element => {
  const { t } = useTranslation();
  const { progress, handleSubmit, canSubmit, importableCount } =
    useImportSubmit();
  const { handlePrevStep } = useImportWizard();

  const isInProgress =
    progress.status === IMPORT_PROGRESS_STATUS.submitting ||
    progress.status === IMPORT_PROGRESS_STATUS.completed;

  return (
    <div className="flex flex-col gap-4 pb-8">
      <Card className="p-6">
        <h3 className="mb-4 text-sm font-medium text-foreground">
          {t('import.confirm.title')}
        </h3>

        {progress.status === IMPORT_PROGRESS_STATUS.idle && (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-muted-foreground">
              {t('import.confirm.readyDescription', { count: importableCount })}
            </p>
          </div>
        )}

        {progress.status === IMPORT_PROGRESS_STATUS.submitting && (
          <div className="flex flex-col gap-3">
            <Progress value={progress.savedRows} max={progress.totalRows} />
            <p className="text-xs text-muted-foreground">
              {t('import.confirm.saved', { count: progress.savedRows })}
            </p>
          </div>
        )}

        {progress.status === IMPORT_PROGRESS_STATUS.completed && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-income">
              <CheckCircle size={IMPORT_CONFIRM_LAYOUT.resultIconSize} />
              <span className="text-sm font-medium">
                {t('import.confirm.success')}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('import.confirm.successDetail', {
                saved: progress.savedRows,
                duplicates: progress.duplicatesSkipped,
              })}
            </p>
            {progress.rejectedRows.length > 0 && (
              <ul className="space-y-1">
                {progress.rejectedRows.map((rejection) => (
                  <li
                    key={rejection.rowIndex}
                    className="flex items-center gap-2 text-xs text-muted-foreground"
                  >
                    <AlertTriangle size={IMPORT_CONFIRM_LAYOUT.rejectionIconSize} />
                    {t('import.confirm.rejectedRow', {
                      row: rejection.rowIndex + IMPORT_CONFIRM_LAYOUT.rowNumberOffset,
                      reason: rejection.reason,
                    })}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {progress.status === IMPORT_PROGRESS_STATUS.failed && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-expense">
              <XCircle size={IMPORT_CONFIRM_LAYOUT.resultIconSize} />
              <span className="text-sm font-medium">
                {t('import.confirm.failed')}
              </span>
            </div>
            {progress.savedRows > 0 && (
              <p className="text-xs text-muted-foreground">
                {t('import.confirm.partialSuccess', {
                  saved: progress.savedRows,
                })}
              </p>
            )}
            <ul className="space-y-1">
              {progress.errors.map((error) => (
                <li key={error} className="flex items-center gap-2 text-xs text-expense">
                  <AlertTriangle size={IMPORT_CONFIRM_LAYOUT.rejectionIconSize} />
                  {error}
                </li>
              ))}
              {progress.rejectedRows.map((rejection) => (
                <li
                  key={rejection.rowIndex}
                  className="flex items-center gap-2 text-xs text-muted-foreground"
                >
                  <AlertTriangle size={IMPORT_CONFIRM_LAYOUT.rejectionIconSize} />
                  {t('import.confirm.rejectedRow', {
                    row: rejection.rowIndex + IMPORT_CONFIRM_LAYOUT.rowNumberOffset,
                    reason: rejection.reason,
                  })}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      <div className="flex justify-between">
        <Button
          variant="secondary"
          onClick={handlePrevStep}
          disabled={isInProgress}
        >
          {t('import.nav.back')}
        </Button>
        {(progress.status === IMPORT_PROGRESS_STATUS.idle ||
          progress.status === IMPORT_PROGRESS_STATUS.failed) && (
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {t('import.confirm.submit')}
          </Button>
        )}
      </div>
    </div>
  );
};
