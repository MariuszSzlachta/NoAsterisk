import { Copy, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useInviteCodesTab } from '#features/admin/ui/hooks/useInviteCodesTab';
import { InviteCodeRow } from '#features/admin/ui/InviteCodeRow';
import { Button } from '#shared/ui/Button';
import { Card } from '#shared/ui/Card';
import { Input } from '#shared/ui/Input';
import { Skeleton } from '#shared/ui/Skeleton';


export const InviteCodesTab = (): React.JSX.Element => {
  const { t } = useTranslation();
  const state = useInviteCodesTab();

  if (state.status === 'loading') {
    return <Skeleton className="h-96" />;
  }

  if (state.status === 'error') {
    return (
      <div className="rounded-md bg-expense-soft px-4 py-3" role="alert">
        <p className="text-sm text-expense">{state.error}</p>
      </div>
    );
  }

  const {
    codes,
    generatedCode,
    expiryDate,
    isGeneratePending,
    generateError,
    deleteError,
    handleGenerate,
    handleExpiryChange,
    handleCopy,
    handleDelete,
  } = state;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* Left panel: Generate */}
      <Card>
        <h3 className="mb-1 text-sm font-semibold text-foreground">
          {t('admin.codes.newCode')}
        </h3>
        <p className="mb-4 text-xs text-muted-foreground">
          {t('admin.codes.newCodeDesc')}
        </p>

        {generateError && (
          <div className="mb-4 rounded-md bg-expense-soft px-3 py-2" role="alert">
            <p className="text-xs text-expense">{generateError}</p>
          </div>
        )}

        <Button
          icon={<Plus size={14} />}
          onClick={handleGenerate}
          disabled={isGeneratePending}
          className="mb-4 w-full"
        >
          {t('admin.codes.generate')}
        </Button>

        {generatedCode && (
          <div className="mb-4 rounded-md border border-border bg-surface-2 p-3">
            <span className="text-xs uppercase text-muted-foreground">
              {t('admin.codes.lastGenerated')}
            </span>
            <div className="mt-1 flex items-center justify-between">
              <span className="font-mono text-lg font-bold text-foreground">
                {generatedCode}
              </span>
              <Button variant="ghost" size="icon" onClick={handleCopy} aria-label={t('admin.codes.copy')}>
                <Copy size={14} />
              </Button>
            </div>
          </div>
        )}

        <label className="text-xs text-muted-foreground">
          {t('admin.codes.expiryLabel')}
          <Input
            type="date"
            value={expiryDate}
            onChange={handleExpiryChange}
            className="mt-1"
          />
        </label>
      </Card>

      {/* Right panel: Table */}
      <div className="lg:col-span-2">
        {deleteError && (
          <div className="mb-4 rounded-md bg-expense-soft px-4 py-3" role="alert">
            <p className="text-sm text-expense">{deleteError}</p>
          </div>
        )}
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2 text-left text-xs font-medium uppercase text-muted-foreground">
                <th className="px-3 py-2">{t('admin.codes.colCode')}</th>
                <th className="px-3 py-2">{t('admin.codes.colStatus')}</th>
                <th className="px-3 py-2">{t('admin.codes.colCreated')}</th>
                <th className="px-3 py-2">{t('admin.codes.colUsedBy')}</th>
                <th className="w-12 px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {codes.map((code) => (
                <InviteCodeRow key={code.id} code={code} onDelete={handleDelete} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
