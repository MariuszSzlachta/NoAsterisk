import { useTranslation } from 'react-i18next';
import { ChevronsUpDown } from 'lucide-react';

export const UserSection = (): React.JSX.Element => {
  const { t } = useTranslation();

  return (
    <div className="mt-auto border-t border-border p-3">
      <button
        type="button"
        aria-label={t('user.workspace')}
        className="flex w-full items-center gap-2.5 rounded-md p-2 transition-colors hover:bg-surface-2"
      >
        <div
          aria-hidden="true"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface-3 text-xs font-semibold text-muted-foreground"
        >
          KN
        </div>
        <div className="min-w-0 flex-1 text-left">
          <div className="truncate text-[13px] font-medium text-foreground">
            {t('user.workspace')}
          </div>
          <div className="text-[11px] text-subtle">{t('user.email')}</div>
        </div>
        <ChevronsUpDown size={15} className="text-subtle" aria-hidden="true" />
      </button>
    </div>
  );
};
