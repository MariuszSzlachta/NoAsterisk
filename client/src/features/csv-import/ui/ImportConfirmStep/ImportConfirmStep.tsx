import { useTranslation } from 'react-i18next';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

import { useImportSubmit } from '#features/csv-import/ui/hooks/useImportSubmit';
import { useImportWizard } from '#features/csv-import/ui/hooks/useImportWizard';
import { Button } from '#shared/ui/Button';
import { Card } from '#shared/ui/Card';
import { Progress } from '#shared/ui/Progress';

export const ImportConfirmStep = (): React.JSX.Element => {
  const { t } = useTranslation();
  const { progress, handleSubmit, canSubmit, importableCount } =
    useImportSubmit();
  const { handlePrevStep } = useImportWizard();

  const percentComplete =
    progress.totalChunks > 0
      ? Math.round((progress.completedChunks / progress.totalChunks) * 100)
      : 0;

  // terminalnym stanem i starym progress zamiast nowej sesji importu.
  const isInProgress =
    progress.status === 'submitting' || progress.status === 'completed';

  return (
    <div className="flex flex-col gap-4 pb-8">
      <Card className="p-6">
        <h3 className="mb-4 text-sm font-medium text-foreground">
          {t('import.confirm.title')}
        </h3>

        {progress.status === 'idle' && (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-muted-foreground">
              {t('import.confirm.readyDescription', { count: importableCount })}
            </p>
          </div>
        )}

        {progress.status === 'submitting' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {t('import.confirm.progress', {
                  completed: progress.completedChunks,
                  total: progress.totalChunks,
                })}
              </span>
              <span>{percentComplete}%</span>
            </div>
            <Progress value={percentComplete} />
            <p className="text-xs text-muted-foreground">
              {t('import.confirm.saved', { count: progress.savedRows })}
            </p>
          </div>
        )}

        {progress.status === 'completed' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-income">
              <CheckCircle size={18} />
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
          </div>
        )}

        {progress.status === 'failed' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-expense">
              <XCircle size={18} />
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
              {progress.errors.map((err) => (
                <li
                  key={err.chunkIndex}
                  className="flex items-center gap-2 text-xs text-expense"
                >
                  <AlertTriangle size={12} />
                  {err.message}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="secondary"
          onClick={handlePrevStep}
          disabled={isInProgress}
        >
          {t('import.nav.back')}
        </Button>
        {(progress.status === 'idle' || progress.status === 'failed') && (
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {t('import.confirm.submit')}
          </Button>
        )}
      </div>
    </div>
  );
};
