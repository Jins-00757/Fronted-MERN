import { useState, useEffect, useCallback } from 'react';
import themeContext from './themeContext';

const STORAGE_KEY = 'theme';

/**
 * On first-ever visit (nothing stored yet) respect the OS preference; every
 * visit after a manual toggle respects that explicit choice instead.
 */
const getInitialTheme = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;

  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const value = { theme, toggleTheme };

  return <themeContext.Provider value={value}>{children}</themeContext.Provider>;
};

export default ThemeProvider;
