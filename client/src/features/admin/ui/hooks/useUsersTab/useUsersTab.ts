import { useState } from 'react';

import {
  useAdminUsersQuery,
  useBlockUserMutation,
  useDeleteUserMutation,
} from '#features/admin';
import type { AdminUserViewModel } from '#features/admin';

// ─── Constants ───────────────────────────────────────────────────

const PAGE_SIZE = 8;

// ─── Result Interface ────────────────────────────────────────────

interface UseUsersTabResult {
  readonly isLoading: boolean;
  readonly users: readonly AdminUserViewModel[];
  readonly totalUsers: number;
  readonly searchQuery: string;
  readonly currentPage: number;
  readonly totalPages: number;
  readonly deleteTarget: AdminUserViewModel | undefined;
  readonly handleSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  readonly handlePrevPage: () => void;
  readonly handleNextPage: () => void;
  readonly handleBlock: (userId: string, block: boolean) => void;
  readonly handleDeleteRequest: (user: AdminUserViewModel) => void;
  readonly handleDeleteConfirm: () => void;
  readonly handleDeleteCancel: () => void;
}

// ─── Hook ────────────────────────────────────────────────────────

export const useUsersTab = (): UseUsersTabResult => {
  const usersQuery = useAdminUsersQuery();
  const { toggleBlock } = useBlockUserMutation();
  const { deleteUser } = useDeleteUserMutation();

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<AdminUserViewModel | undefined>(undefined);

  // REVIEW [P1]: QueryState error/notLoaded trafia do tej samej ścieżki co
  // pusty wynik. Dodatkowo mutacje poniżej są fire-and-forget. Trzeba wystawić
  // loading/error/retry oraz obsłużyć odrzucenie mutacji, inaczej UI może pokazać
  // pustą tabelę albo zamknąć potwierdzenie mimo nieudanego delete.
  const isLoading = usersQuery.status === 'loading';

  const allUsers: readonly AdminUserViewModel[] =
    usersQuery.status === 'loaded' ? usersQuery.data.users : [];

  const filteredUsers = searchQuery
    ? allUsers.filter((u) => u.email.toLowerCase().includes(searchQuery.toLowerCase()))
    : allUsers;

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const users = filteredUsers.slice(startIndex, startIndex + PAGE_SIZE);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchQuery(event.target.value);
    setCurrentPage(1);
  };

  const handlePrevPage = (): void => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = (): void => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleBlock = (userId: string, block: boolean): void => {
    void toggleBlock(userId, block);
  };

  const handleDeleteRequest = (user: AdminUserViewModel): void => {
    setDeleteTarget(user);
  };

  const handleDeleteConfirm = (): void => {
    if (deleteTarget) {
      void deleteUser(deleteTarget.id);
      setDeleteTarget(undefined);
    }
  };

  const handleDeleteCancel = (): void => {
    setDeleteTarget(undefined);
  };

  return {
    isLoading,
    users,
    totalUsers: allUsers.length,
    searchQuery,
    currentPage,
    totalPages,
    deleteTarget,
    handleSearchChange,
    handlePrevPage,
    handleNextPage,
    handleBlock,
    handleDeleteRequest,
    handleDeleteConfirm,
    handleDeleteCancel,
  };
};
