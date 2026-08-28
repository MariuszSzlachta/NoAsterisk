import type { AdminUserViewModel } from '#features/admin/model/types/admin-user-view-model';

export interface UserRowProps {
  readonly user: AdminUserViewModel;
  readonly onBlock: (userId: string, block: boolean) => void;
  readonly onDelete: (user: AdminUserViewModel) => void;
}
