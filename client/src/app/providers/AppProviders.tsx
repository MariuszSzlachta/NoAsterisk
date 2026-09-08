import type { ReactNode } from 'react';

import { QueryProvider } from '#app/providers/QueryProvider';
import { PersistenceProvider } from '#app/providers/PersistenceProvider';
import { ThemeProvider } from '#app/providers/ThemeProvider';

interface AppProvidersProps {
  children: ReactNode;
}

export const AppProviders = ({
  children,
}: AppProvidersProps): React.JSX.Element => (
  <ThemeProvider>
    <PersistenceProvider>
      <QueryProvider>{children}</QueryProvider>
    </PersistenceProvider>
  </ThemeProvider>
);
