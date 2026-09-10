import type { ReactNode } from 'react';

import { usePersistenceLifecycle } from '#app/providers/PersistenceProvider/usePersistenceLifecycle/usePersistenceLifecycle';

interface PersistenceProviderProps {
  readonly children: ReactNode;
}

export const PersistenceProvider = ({
  children,
}: PersistenceProviderProps): React.JSX.Element => {
  usePersistenceLifecycle();

  return <>{children}</>;
};
