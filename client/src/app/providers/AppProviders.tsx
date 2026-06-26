import type { ReactNode } from 'react';
import { ThemeProvider } from './ThemeProvider';
import { QueryProvider } from './QueryProvider';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps): React.JSX.Element {
  return (
    <ThemeProvider>
      <QueryProvider>
        {children}
      </QueryProvider>
    </ThemeProvider>
  );
}
