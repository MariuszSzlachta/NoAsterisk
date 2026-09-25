import { useCallback, useEffect, useState, type ReactNode } from 'react';

import { ThemeContext, type Theme } from '#app/providers/ThemeContext';

const STORAGE_KEY = 'budget-theme';
const DARK_CLASS = 'dark';
const LIGHT_CLASS = 'light';
const DARK_MEDIA_QUERY = '(prefers-color-scheme: dark)';

const getInitialTheme = (): Theme => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'dark' || stored === 'light') {
    return stored;
  }
  return window.matchMedia(DARK_MEDIA_QUERY).matches ? 'dark' : 'light';
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({
  children,
}: ThemeProviderProps): React.JSX.Element => {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle(DARK_CLASS, theme === 'dark');
    root.classList.toggle(LIGHT_CLASS, theme === 'light');
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const setTheme = useCallback((nextTheme: Theme): void => {
    setThemeState(nextTheme);
  }, []);

  const toggleTheme = useCallback((): void => {
    setThemeState((previousTheme) =>
      previousTheme === 'dark' ? 'light' : 'dark',
    );
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
