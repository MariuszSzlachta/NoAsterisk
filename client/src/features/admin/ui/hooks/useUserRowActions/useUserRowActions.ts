import type { AdminUserViewModel } from '#features/admin';

// ─── Result Interface ────────────────────────────────────────────

interface UseUserRowActionsResult {
  readonly handleBlock: () => void;
  readonly handleDelete: () => void;
}

// ─── Hook ────────────────────────────────────────────────────────

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
