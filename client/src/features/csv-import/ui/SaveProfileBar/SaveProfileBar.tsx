import { Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '#shared/ui/Button';

interface SaveProfileBarProps {
  readonly onSave: () => void;
}

export const SaveProfileBar = ({
  onSave,
}: SaveProfileBarProps): React.JSX.Element => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3">
      <Save size={16} className="shrink-0 text-muted-foreground" />
      <p className="flex-1 text-[13px] text-muted-foreground">
        {t('import.mapping.saveProfilePrompt')}
      </p>
      <Button variant="secondary" size="sm" onClick={onSave}>
        {t('import.mapping.saveProfileButton')}
      </Button>
    </div>
  );
};
