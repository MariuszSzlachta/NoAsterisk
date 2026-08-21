// ═══════════════════════════════════════════════════════════════════
// User Settings — ProfileSection Component
// ═══════════════════════════════════════════════════════════════════

import { Copy, Lock } from 'lucide-react';

import { useProfileSection } from '#features/user-settings/ui/hooks/useProfileSection';
import { Button } from '#shared/ui/Button';
import { Card } from '#shared/ui/Card';
import { Input } from '#shared/ui/Input';

// ─── Component ───────────────────────────────────────────────────

export const ProfileSection = (): React.JSX.Element => {
  const {
    profile,
    isLoading,
    editedName,
    nameError,
    isDirty,
    isSaving,
    handleNameChange,
    handleSave,
  } = useProfileSection();

  if (isLoading || !profile) {
    return (
      <Card className="mb-6">
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
    <Card className="mb-6">
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
          <span className="text-xs text-subtle">Członek od {memberSince}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Nazwa wyświetlana"
          value={editedName}
          onChange={(e) => handleNameChange(e.target.value)}
          error={nameErrorMessage}
          placeholder="Twoja nazwa"
        />
        <Input
          label="Email"
          value={profile.email}
          readOnly
          icon={<Lock size={14} className="text-subtle" />}
          className="bg-surface-3"
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">Workspace ID</label>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded-md border border-border bg-surface-3 px-3 py-2 font-mono text-xs text-muted-foreground">
              {profile.workspaceId}
            </code>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => navigator.clipboard.writeText(profile.workspaceId)}
              aria-label="Kopiuj Workspace ID"
            >
              <Copy size={14} />
            </Button>
          </div>
        </div>
        <Input
          label="Rola"
          value={profile.role === 'Superuser' ? 'Administrator' : 'Członek'}
          readOnly
          className="bg-surface-3"
        />
      </div>

      <div className="mt-4">
        <Button
          onClick={() => void handleSave()}
          disabled={!isDirty || nameError !== undefined || isSaving}
        >
          {isSaving ? 'Zapisywanie...' : 'Zapisz'}
        </Button>
      </div>
    </Card>
  );
};
