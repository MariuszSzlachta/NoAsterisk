import { useTranslation } from 'react-i18next';

import { Button } from '#shared/ui/Button';
import { Card, CardHeader } from '#shared/ui/Card';

// ─── Props ───────────────────────────────────────────────────────

interface DictionaryDisplayItem {
  readonly label: string;
  readonly count: number;
  readonly lastUpdated: string;
}

interface DictionariesPanelProps {
  readonly items: readonly DictionaryDisplayItem[];
  readonly onManage: (tabId: string) => void;
  readonly targetTab: string;
}

// ─── Component ───────────────────────────────────────────────────

export const DictionariesPanel = ({
  items,
  onManage,
  targetTab,
}: DictionariesPanelProps): React.JSX.Element => {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader title={t('admin.dashboard.dictionaries')} />

      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between"
          >
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">{item.label}</span>
              <span className="text-xs text-muted-foreground">
                {item.count.toLocaleString()} {t('admin.dashboard.entries')} · {item.lastUpdated}
              </span>
            </div>
            <Button variant="secondary" size="sm" onClick={() => onManage(targetTab)}>
              {t('admin.dashboard.manage')}
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
};
