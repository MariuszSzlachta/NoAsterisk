import { useSyncExternalStore } from 'react';
import { Outlet } from 'react-router-dom';

import { VaultUnlockScreen } from '#app/routing/VaultUnlockScreen';
import { encryptedPersistence } from '#shared/adapters/persistence';

export const RequireVault = (): React.JSX.Element => {
  const snapshot = useSyncExternalStore(
    encryptedPersistence.subscribe,
    encryptedPersistence.getSnapshot,
    encryptedPersistence.getSnapshot,
  );

  if (snapshot.status === 'unlocked') {
    return <Outlet />;
  }

  return <VaultUnlockScreen snapshot={snapshot} />;
};
