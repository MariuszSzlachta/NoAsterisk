// User Settings — ProfileSection Component

import { Copy, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useProfileSection } from '#features/user-settings/ui/hooks/useProfileSection';
import { Button } from '#shared/ui/Button';
import { Card } from '#shared/ui/Card';
import { Input } from '#shared/ui/Input';


export const ProfileSection = (): React.JSX.Element => {
  const { t } = useTranslation();
  const {
    profile,
    isLoading,
    editedName,
    nameError,
    isDirty,
    isSaving,
    handleNameChange,
    handleSave,
    handleCancel,
  } = useProfileSection();

  if (isLoading || !profile) {
    return (
      <Card className="">
        <div className="animate-pulse space-y-4">
          <div className="h-14 w-14 rounded-lg bg-surface-3" />
          <div className="h-4 w-48 rounded bg-surface-3" />
        </div>
      </Card>
    );
  }

  const initials = (profile.displayName ?? profile.email)
    .split(' ')
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const memberSince = new Date(profile.createdAt).toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const nameErrorMessage = nameError === 'TOO_LONG' ? 'Nazwa nie może przekraczać 50 znaków' : undefined;

  return (
    <Card className="">
      <div className="mb-4 flex items-center gap-3">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-lg bg-surface-3 text-base font-semibold text-muted-foreground"
          aria-hidden="true"
        >
          {initials}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">
              {profile.displayName ?? profile.email}
            </span>
            <span className="rounded bg-surface-3 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              {profile.role}
            </span>
          </div>
          <span className="text-xs text-subtle">{t('settings.profile.memberSince', { date: memberSince })}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label={t('settings.profile.displayName')}
          value={editedName}
          onChange={(e) => handleNameChange(e.target.value)}
          error={nameErrorMessage}
          placeholder={t('settings.profile.displayNamePlaceholder')}
        />
        <Input
          label={t('settings.profile.email')}
          value={profile.email}
          readOnly
          icon={<Lock size={14} className="text-subtle" />}
          className="bg-surface-3"
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">{t('settings.profile.workspaceId')}</label>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded-md border border-border bg-surface-3 px-3 py-2 font-mono text-xs text-muted-foreground">
              {profile.workspaceId}
            </code>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => navigator.clipboard.writeText(profile.workspaceId)}
              aria-label={t('settings.profile.copyWorkspaceId')}
            >
              <Copy size={14} />
            </Button>
          </div>
        </div>
        <Input
          label={t('settings.profile.role')}
          value={profile.role === 'Superuser' ? t('settings.profile.roleAdmin') : t('settings.profile.roleMember')}
          readOnly
          className="bg-surface-3"
        />
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Button
          onClick={() => void handleSave()}
          disabled={!isDirty || nameError !== undefined || isSaving}
        >
          {isSaving ? t('settings.profile.saving') : t('settings.profile.save')}
        </Button>
        {isDirty && (
          <Button variant="ghost" onClick={handleCancel}>
            {t('settings.profile.cancel')}
          </Button>
        )}
      </div>
    </Card>
  );
};
