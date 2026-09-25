import { useSyncExternalStore } from 'react';
import { Outlet } from 'react-router-dom';

import { AppShellSkeleton } from '#app/layouts/AppShell/AppShellSkeleton';
import { useVaultAutomaticSync } from '#app/routing/useVaultAutomaticSync';
import { VaultUnlockScreen } from '#app/routing/VaultUnlockScreen';
import { useProfileQuery } from '#features/user-settings';
import { encryptedPersistence } from '#shared/adapters/persistence';

export const RequireVault = (): React.JSX.Element => {
  const { data: profile, isLoading: isProfileLoading } = useProfileQuery();
  const snapshot = useSyncExternalStore(
    encryptedPersistence.subscribe,
    encryptedPersistence.getSnapshot,
    encryptedPersistence.getSnapshot,
  );

  useVaultAutomaticSync(snapshot.status === 'unlocked');

  // Establish the account database namespace before opening the unlock screen.
  // Otherwise the first unlock can succeed against `anonymous`, then Sidebar's
  // profile request switches the namespace and intentionally locks the session.
  if (isProfileLoading || profile === undefined) {
    return <AppShellSkeleton />;
  }

  if (snapshot.status === 'unlocked') {
    return <Outlet />;
  }

  return (
    <VaultUnlockScreen
      snapshot={snapshot}
      accountId={profile.id}
      workspaceId={profile.workspaceId}
    />
  );
};
