import { useEffect, type ReactNode } from 'react';

import { clearHydratedFinancialStores } from '#app/providers/hydrate-financial-stores';
import { encryptedPersistence } from '#shared/adapters/persistence';

interface PersistenceProviderProps {
  readonly children: ReactNode;
}

export const PersistenceProvider = ({
  children,
}: PersistenceProviderProps): React.JSX.Element => {
  useEffect(() => {
    void encryptedPersistence.requestPersistentStorage();
  }, []);

  useEffect(() => {
    if (encryptedPersistence.getSnapshot().status !== 'unlocked') {
      clearHydratedFinancialStores();
    }
  }, []);

  useEffect(() => {
    const unsubscribe = encryptedPersistence.subscribe(() => {
      if (encryptedPersistence.getSnapshot().status !== 'unlocked') {
        clearHydratedFinancialStores();
      }
    });
    return unsubscribe;
  }, []);

  return <>{children}</>;
};
