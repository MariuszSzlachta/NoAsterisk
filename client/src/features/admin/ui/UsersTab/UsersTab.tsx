import { useTranslation } from 'react-i18next';

import { ConfirmDeleteModal } from '#features/admin/ui/ConfirmDeleteModal';
import { useUsersTab } from '#features/admin/ui/hooks/useUsersTab';
import { UserRow } from '#features/admin/ui/UserRow';
import { Button } from '#shared/ui/Button';
import { Input } from '#shared/ui/Input';
import { Skeleton } from '#shared/ui/Skeleton';


export const UsersTab = (): React.JSX.Element => {
  const { t } = useTranslation();
  const state = useUsersTab();

  if (state.status === 'loading') {
    return <Skeleton className="h-96" />;
  }

  if (state.status === 'error') {
    return (
      <div className="rounded-md bg-expense-soft px-4 py-3" role="alert">
        <p className="text-sm text-expense">{state.error}</p>
      </div>
    );
  }

  const {
    users,
    totalUsers,
    searchQuery,
    currentPage,
    totalPages,
    deleteTarget,
    blockError,
    deleteError,
    handleSearchChange,
    handlePrevPage,
    handleNextPage,
    handleBlock,
    handleDeleteRequest,
    handleDeleteConfirm,
    handleDeleteCancel,
  } = state;

  return (
    <div className="flex flex-col gap-4">
      {blockError && (
        <div className="rounded-md bg-expense-soft px-4 py-3" role="alert">
          <p className="text-sm text-expense">{blockError}</p>
        </div>
      )}
      {deleteError && (
        <div className="rounded-md bg-expense-soft px-4 py-3" role="alert">
          <p className="text-sm text-expense">{deleteError}</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <Input
          placeholder={t('admin.users.searchPlaceholder')}
          value={searchQuery}
          onChange={handleSearchChange}
          className="max-w-sm"
        />
        <span className="text-sm text-muted-foreground">
          {totalUsers} {t('admin.users.count')}
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-2 text-left text-xs font-medium uppercase text-muted-foreground">
              <th className="px-3 py-2">{t('admin.users.colEmail')}</th>
              <th className="px-3 py-2">{t('admin.users.colRole')}</th>
              <th className="px-3 py-2">{t('admin.users.colRegistered')}</th>
              <th className="px-3 py-2 text-center">{t('admin.users.colVault')}</th>
              <th className="px-3 py-2">{t('admin.users.colActions')}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                onBlock={handleBlock}
                onDelete={handleDeleteRequest}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {t('admin.users.page', { current: currentPage, total: totalPages })}
        </span>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" disabled={currentPage <= 1} onClick={handlePrevPage}>
            ←
          </Button>
          <Button variant="ghost" size="sm" disabled={currentPage >= totalPages} onClick={handleNextPage}>
            →
          </Button>
        </div>
      </div>

      {deleteTarget && (
        <ConfirmDeleteModal
          title={t('admin.modal.deleteUserTitle')}
          description={t('admin.modal.deleteUserDesc', { email: deleteTarget.email })}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      )}
    </div>
  );
};
