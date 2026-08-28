import { useTranslation } from 'react-i18next';
import { Landmark } from 'lucide-react';

import { Button } from '#shared/ui/Button';

interface BankProfileBarProps {
  readonly bankName: string;
  readonly onUseProfile: () => void;
  readonly onCustomize: () => void;
}

export const BankProfileBar = ({
  bankName,
  onUseProfile,
  onCustomize,
}: BankProfileBarProps): React.JSX.Element => {
  const { t } = useTranslation();

  return (
    <div className="mt-5 flex items-center gap-3 rounded-xl bg-income/10 px-4 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-income/20 text-income">
        <Landmark size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-foreground">
          {t('import.upload.profileRecognized', { bank: bankName })}
        </p>
        <p className="text-[12px] text-muted-foreground">
          {t('import.upload.profileDescription')}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={onUseProfile}>
          {t('import.upload.profileUse')}
        </Button>
        <Button variant="secondary" size="sm" onClick={onCustomize}>
          {t('import.upload.profileCustomize')}
        </Button>
      </div>
    </div>
  );
};
