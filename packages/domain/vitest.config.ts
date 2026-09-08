import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '#domain/shared': resolve(__dirname, 'src/shared'),
      '#domain/transaction': resolve(__dirname, 'src/transaction'),
      '#domain/account': resolve(__dirname, 'src/account'),
      '#domain/categorization-rule': resolve(__dirname, 'src/categorization-rule'),
      '#domain/category': resolve(__dirname, 'src/category'),
      '#domain/budget': resolve(__dirname, 'src/budget'),
    },
  },
  test: {
    globals: false,
    include: ['src/**/*.spec.ts'],
  },
});
