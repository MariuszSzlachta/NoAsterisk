import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { AppProviders } from '#app/providers/AppProviders';
import { AppRouter } from '#app/routing/AppRouter';

import '#shared/i18n/i18n';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

createRoot(rootElement).render(
  <StrictMode>
    <AppProviders>
      <AppRouter />
    </AppProviders>
  </StrictMode>,
);
