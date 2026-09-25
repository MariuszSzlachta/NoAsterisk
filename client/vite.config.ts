import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import { bundleBudgetPlugin } from './scripts/bundle-budget-plugin.js';

export default defineConfig({
  plugins: [react(), tailwindcss(), bundleBudgetPlugin()],
  build: {
    // AG Grid is isolated in a deferred route chunk. Gzip and initial-load budgets
    // are enforced independently by bundleBudgetPlugin.
    chunkSizeWarningLimit: 1300,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
