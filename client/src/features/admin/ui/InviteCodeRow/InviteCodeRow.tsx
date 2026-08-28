import { Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Badge } from '#shared/ui/Badge';
import { Button } from '#shared/ui/Button';

import type { InviteCodeRowProps } from '#features/admin/ui/InviteCodeRow/invite-code-row-props';
import { STATUS_BADGE_COLOR } from '#features/admin/ui/InviteCodeRow/status-badge-color';

export const InviteCodeRow = ({ code, onDelete }: InviteCodeRowProps): React.JSX.Element => {
  const { t } = useTranslation();

  const handleDelete = (): void => {
    onDelete(code.id);
  };

  return (
    <tr className="border-b border-border/50 transition-colors hover:bg-surface-2">
      <td className="px-3 py-3 font-mono text-sm text-foreground">{code.code}</td>
      <td className="px-3 py-3">
        <Badge variant="soft" color={STATUS_BADGE_COLOR[code.status]} dot={false}>
          {t(`admin.codeStatus.${code.status}`)}
        </Badge>
      </td>
      <td className="px-3 py-3 font-mono text-xs text-muted-foreground">
        {code.createdAt}
      </td>
      <td className="px-3 py-3 text-xs text-muted-foreground">
        {code.usedBy ?? '—'}
      </td>
      <td className="px-3 py-3">
        {code.status === 'Available' && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            aria-label={t('admin.codes.delete')}
          >
            <Trash2 size={14} className="text-expense" />
          </Button>
        )}
      </td>
    </tr>
  );
};
