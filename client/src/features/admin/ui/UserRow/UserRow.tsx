import { Ban, Check, Trash2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { AdminUserRole, AdminUserViewModel } from '#features/admin';
import { useUserRowActions } from '#features/admin/ui/hooks/useUserRowActions';
import { Badge } from '#shared/ui/Badge';
import { Button } from '#shared/ui/Button';

// ─── Constants ───────────────────────────────────────────────────

const ROLE_BADGE_COLOR: Record<AdminUserRole, 'primary' | 'neutral' | 'expense'> = {
  Superuser: 'primary',
  Member: 'neutral',
  Blocked: 'expense',
};

// ─── Props ───────────────────────────────────────────────────────

interface UserRowProps {
  readonly user: AdminUserViewModel;
  readonly onBlock: (userId: string, block: boolean) => void;
  readonly onDelete: (user: AdminUserViewModel) => void;
}

// ─── Component ───────────────────────────────────────────────────

export const UserRow = ({ user, onBlock, onDelete }: UserRowProps): React.JSX.Element => {
  const { t } = useTranslation();
  const { handleBlock, handleDelete } = useUserRowActions(user, onBlock, onDelete);
  const isBlocked = user.role === 'Blocked';

  return (
    <tr className="border-b border-border/50 transition-colors hover:bg-surface-2">
      <td className="px-3 py-3 text-sm text-foreground">{user.email}</td>
      <td className="px-3 py-3">
        <Badge variant="soft" color={ROLE_BADGE_COLOR[user.role]} dot={false}>
          {isBlocked ? t('admin.roles.blocked') : user.role}
        </Badge>
      </td>
      <td className="px-3 py-3 font-mono text-xs text-muted-foreground">{user.createdAt}</td>
      <td className="px-3 py-3 text-center">
        {user.hasVault ? (
          <Check size={16} className="inline-block text-income" />
        ) : (
          <X size={16} className="inline-block text-muted-foreground" />
        )}
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBlock}
            aria-label={isBlocked ? t('admin.users.unblock') : t('admin.users.block')}
          >
            <Ban size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            aria-label={t('admin.users.delete')}
          >
            <Trash2 size={14} className="text-expense" />
          </Button>
        </div>
      </td>
    </tr>
  );
};
