import { useState } from 'react';

import { useAdminUsersQuery } from '#features/admin/api/useAdminUsersQuery';
import { useBlockUserMutation } from '#features/admin/api/useBlockUserMutation';
import { useDeleteUserMutation } from '#features/admin/api/useDeleteUserMutation';
import type { AdminUserViewModel } from '#features/admin/model/types/admin-user-view-model';

import { PAGE_SIZE } from '#features/admin/ui/hooks/useUsersTab/constants/page-size';
import type { UseUsersTabResult } from '#features/admin/ui/hooks/useUsersTab/use-users-tab-result';

export const useUsersTab = (): UseUsersTabResult => {
  const usersQuery = useAdminUsersQuery();
  const { toggleBlock, isLoading: isBlockPending, error: blockError } = useBlockUserMutation();
  const { deleteUser, isLoading: isDeletePending, error: deleteError } = useDeleteUserMutation();

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<AdminUserViewModel | undefined>(undefined);

  if (usersQuery.status === 'loading' || usersQuery.status === 'notLoaded') {
    return { status: 'loading' };
  }

  if (usersQuery.status === 'error') {
    return { status: 'error', error: usersQuery.error };
  }

  const allUsers: readonly AdminUserViewModel[] = usersQuery.data.users;

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
      void deleteUser(deleteTarget.id).then(() => {
        setDeleteTarget(undefined);
      });
    }
  };

  const handleDeleteCancel = (): void => {
    setDeleteTarget(undefined);
  };

  return {
    status: 'loaded',
    users,
    totalUsers: allUsers.length,
    searchQuery,
    currentPage,
    totalPages,
    deleteTarget,
    isBlockPending,
    blockError,
    isDeletePending,
    deleteError,
    handleSearchChange,
    handlePrevPage,
    handleNextPage,
    handleBlock,
    handleDeleteRequest,
    handleDeleteConfirm,
    handleDeleteCancel,
  };
};
