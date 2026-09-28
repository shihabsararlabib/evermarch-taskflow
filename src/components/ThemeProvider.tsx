'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { THEME_STORAGE_KEY } from '@/lib/constants';
import { safeLocalStorage } from '@/lib/safeStorage';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  toggleTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const stored = safeLocalStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
      if (stored === 'dark' || stored === 'light') {
        setTheme(stored);
      } else if (typeof window !== 'undefined' && window.matchMedia) {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setTheme(prefersDark ? 'dark' : 'light');
      }
    } catch {
      setTheme('dark');
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      document.documentElement.classList.toggle('dark', theme === 'dark');
      safeLocalStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Safely ignore storage set errors in restricted browser profiles
    }
  }, [theme, mounted]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-black" />;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
