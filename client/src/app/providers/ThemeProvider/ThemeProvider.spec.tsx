import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { useTheme } from '#app/providers/useTheme';

import { ThemeProvider } from './ThemeProvider';

const STORAGE_KEY = 'budget-theme';

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark', 'light');
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark', 'light');
  });

  it.each([
    ['dark', 'light'],
    ['light', 'dark'],
  ] as const)(
    'applies the %s class and removes the mutually exclusive class',
    async (theme, excludedClass) => {
      localStorage.setItem(STORAGE_KEY, theme);

      renderHook(() => useTheme(), { wrapper: ThemeProvider });

      await waitFor(() => {
        expect(document.documentElement).toHaveClass(theme);
        expect(document.documentElement).not.toHaveClass(excludedClass);
      });
    },
  );

  it('keeps document classes and persisted preference aligned when toggled', async () => {
    localStorage.setItem(STORAGE_KEY, 'dark');
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });

    act(() => result.current.toggleTheme());

    await waitFor(() => {
      expect(result.current.theme).toBe('light');
      expect(document.documentElement).toHaveClass('light');
      expect(document.documentElement).not.toHaveClass('dark');
      expect(localStorage.getItem(STORAGE_KEY)).toBe('light');
    });
  });
});
