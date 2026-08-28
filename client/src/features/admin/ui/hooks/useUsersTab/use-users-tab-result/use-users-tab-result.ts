import type { AdminUserViewModel } from '#features/admin/model/types/admin-user-view-model';

export type UseUsersTabResult =
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly error: string }
  | {
      readonly status: 'loaded';
      readonly users: readonly AdminUserViewModel[];
      readonly totalUsers: number;
      readonly searchQuery: string;
      readonly currentPage: number;
      readonly totalPages: number;
      readonly deleteTarget: AdminUserViewModel | undefined;
      readonly isBlockPending: boolean;
      readonly blockError: string | undefined;
      readonly isDeletePending: boolean;
      readonly deleteError: string | undefined;
      readonly handleSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
      readonly handlePrevPage: () => void;
      readonly handleNextPage: () => void;
      readonly handleBlock: (userId: string, block: boolean) => void;
      readonly handleDeleteRequest: (user: AdminUserViewModel) => void;
      readonly handleDeleteConfirm: () => void;
      readonly handleDeleteCancel: () => void;
    };
