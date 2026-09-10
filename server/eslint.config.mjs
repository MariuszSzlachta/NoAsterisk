// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const isStrict = process.env.ESLINT_STRICT === 'true';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs', 'dist/**'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      ecmaVersion: 2024,
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  // Production source rules
  {
    files: ['src/**/*.ts'],
    rules: {
      // --- Type safety: always error ---
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/no-redundant-type-constituents': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',

      // --- Modern JS/TS patterns ---
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-template': 'error',
      'prefer-spread': 'error',
      'prefer-rest-params': 'error',
      'no-param-reassign': 'error',
      'no-nested-ternary': 'error',
      eqeqeq: ['error', 'always'],

      // --- In-memory repos implement async ports synchronously ---
      '@typescript-eslint/require-await': 'off',

      // --- NestJS uses unbound methods in module wiring ---
      '@typescript-eslint/unbound-method': 'off',

      // --- NestJS modules/controllers are decorated classes ---
      '@typescript-eslint/no-extraneous-class': 'off',

      // --- Strict-only (error in CI/pre-commit, relaxed in dev) ---
      'no-console': isStrict ? 'error' : 'off',
      '@typescript-eslint/no-unused-vars': isStrict
        ? ['error', { argsIgnorePattern: '^_' }]
        : ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-floating-promises': isStrict ? 'error' : 'warn',

      // --- Prettier ---
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
    },
  },
  // Test files — relax rules that conflict with jest mocking patterns
  {
    files: ['**/*.spec.ts', '**/*.e2e-spec.ts', '**/test/**/*.ts'],
    rules: {
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      'no-param-reassign': 'off',
    },
  },
  // Database seed/migration entry points are intentional CLI processes.
  {
    files: ['src/**/seed*.ts', 'src/**/migrate.ts'],
    rules: {
      'no-console': 'off',
    },
  },
);
