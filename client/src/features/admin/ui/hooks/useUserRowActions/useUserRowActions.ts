import type { AdminUserViewModel } from '#features/admin/model/types/admin-user-view-model';

import type { UseUserRowActionsResult } from '#features/admin/ui/hooks/useUserRowActions/use-user-row-actions-result';

export const useUserRowActions = (
  user: AdminUserViewModel,
  onBlock: (userId: string, block: boolean) => void,
  onDelete: (user: AdminUserViewModel) => void,
): UseUserRowActionsResult => {
  const isBlocked = user.role === 'Blocked';

  const handleBlock = (): void => {
    onBlock(user.id, !isBlocked);
  };

  const handleDelete = (): void => {
    onDelete(user);
  };

  return { handleBlock, handleDelete };
};
