import type { ReactNode } from 'react';

import { QueryProvider } from '#app/providers/QueryProvider';
import { ThemeProvider } from '#app/providers/ThemeProvider';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({
  children,
}: AppProvidersProps): React.JSX.Element {
  return (
    <ThemeProvider>
      <QueryProvider>{children}</QueryProvider>
    </ThemeProvider>
  );
}
