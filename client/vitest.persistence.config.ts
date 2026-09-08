import { defineConfig, mergeConfig } from 'vitest/config';

import baseConfig from './vitest.config';

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      include: ['src/shared/adapters/persistence/persistence.spec.ts'],
      coverage: {
        include: ['src/shared/adapters/persistence/**/*.ts'],
        exclude: ['src/shared/adapters/persistence/**/*.spec.ts'],
        all: true,
        thresholds: {
          statements: 100,
          branches: 90,
          functions: 100,
          lines: 100,
        },
      },
    },
  }),
);
