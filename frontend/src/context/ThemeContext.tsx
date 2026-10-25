import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

export type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const storageKey = user?.id ? `devvalidate_theme_${user.id}` : 'devvalidate_theme_public';

  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const authUser = localStorage.getItem('user');
      if (authUser) {
        const parsed = JSON.parse(authUser);
        if (parsed?.id) {
          const userTheme = localStorage.getItem(`devvalidate_theme_${parsed.id}`);
          if (userTheme === 'dark' || userTheme === 'light') return userTheme;
        }
      }
      const saved = localStorage.getItem('devvalidate_theme_public');
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {
      // fallback
    }
    return typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
      ? 'dark'
      : 'light';
  });

  // When user changes, load that specific user's saved preference
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem(storageKey);
      if (savedTheme === 'dark' || savedTheme === 'light') {
        setThemeState(savedTheme);
      }
    } catch {
      // fallback
    }
  }, [storageKey]);

  // Synchronize 'dark' class on HTML root element and save to localStorage
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(storageKey, theme);
      localStorage.setItem('devvalidate_theme_public', theme);
    } catch {
      // fallback
    }
  }, [theme, storageKey]);

  const applyTheme = useCallback((newTheme: Theme) => {
    const root = document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    setThemeState(newTheme);
    try {
      localStorage.setItem(storageKey, newTheme);
      localStorage.setItem('devvalidate_theme_public', newTheme);
    } catch {
      // fallback
    }
  }, [storageKey]);

  const toggleTheme = useCallback(() => {
    applyTheme(theme === 'light' ? 'dark' : 'light');
  }, [theme, applyTheme]);

  const setTheme = useCallback((newTheme: Theme) => {
    applyTheme(newTheme);
  }, [applyTheme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
};
