import { useTranslation } from 'react-i18next';

import type { InviteCodesPanelProps } from '#features/admin/ui/InviteCodesPanel/invite-codes-panel-props';
import { STATUS_BADGE_COLOR } from '#features/admin/ui/InviteCodesPanel/status-badge-color';
import { useBoundAction } from '#shared/hooks/useBoundAction';
import { Badge } from '#shared/ui/Badge';
import { Button } from '#shared/ui/Button';
import { Card, CardHeader } from '#shared/ui/Card';

export const InviteCodesPanel = ({
  stats,
  recentCodes,
  onGenerate,
  targetTab,
}: InviteCodesPanelProps): React.JSX.Element => {
  const { t } = useTranslation();
  const { handleAction: handleGenerate } = useBoundAction(
    targetTab,
    onGenerate,
  );

  return (
    <Card>
      <CardHeader
        title={t('admin.dashboard.codes')}
        subtitle={`${stats.availableCodes} ${t('admin.dashboard.codesAvailable')} · ${stats.usedCodes} ${t('admin.dashboard.codesUsed')}`}
      />

      <div className="mb-4">
        <Button onClick={handleGenerate}>
          {t('admin.dashboard.generateCode')}
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        {recentCodes.map((code) => (
          <div
            key={code.id}
            className="flex items-center justify-between border-b border-border/50 py-2 last:border-0"
          >
            <span className="font-mono text-sm text-foreground">
              {code.code}
            </span>
            <div className="flex items-center gap-2">
              <Badge
                variant="soft"
                color={STATUS_BADGE_COLOR[code.status]}
                dot={false}
              >
                {t(`admin.codeStatus.${code.status}`)}
              </Badge>
              <span className="max-w-[100px] truncate text-xs text-muted-foreground">
                {code.usedBy ?? '—'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
