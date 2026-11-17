import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem('ayur_theme');
      return saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'system';
    } catch {
      return 'system';
    }
  });

  const [readingPreferences, setReadingPreferences] = useState(() => {
    try {
      const size = localStorage.getItem('ayur_pref_reading_size');
      return { devanagari: localStorage.getItem('ayur_pref_devanagari') !== 'false', contrast: localStorage.getItem('ayur_pref_high_contrast') === 'true', size: ['standard', 'large', 'larger'].includes(size) ? size : 'standard', reduceMotion: localStorage.getItem('ayur_pref_reduce_motion') === 'true' };
    } catch { return { devanagari: true, contrast: false, size: 'standard', reduceMotion: false }; }
  });
  const setReadingPreference = (key, value) => {
    if (key === 'size' ? !['standard', 'large', 'larger'].includes(value) : !['devanagari','contrast','reduceMotion'].includes(key) || typeof value !== 'boolean') return;
    setReadingPreferences(previous => ({ ...previous, [key]: value }));
  };
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-high-contrast', String(readingPreferences.contrast));
    root.setAttribute('data-deva-font', readingPreferences.devanagari ? 'serif' : 'sans');
    root.setAttribute('data-reading-size', readingPreferences.size);
    root.setAttribute('data-reduce-motion', String(readingPreferences.reduceMotion));
    try {
      localStorage.setItem('ayur_pref_devanagari', String(readingPreferences.devanagari));
      localStorage.setItem('ayur_pref_high_contrast', String(readingPreferences.contrast));
      localStorage.setItem('ayur_pref_reading_size', readingPreferences.size);
      localStorage.setItem('ayur_pref_reduce_motion', String(readingPreferences.reduceMotion));
    } catch {}
  }, [readingPreferences]);

  const [systemDark, setSystemDark] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Watch system color scheme changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setSystemDark(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Compute resolved theme: 'light' or 'dark'
  const resolvedTheme = useMemo(() => {
    if (theme === 'system') {
      return systemDark ? 'dark' : 'light';
    }
    return theme;
  }, [theme, systemDark]);

  // Apply to DOM attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolvedTheme);
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) themeMeta.setAttribute('content', resolvedTheme === 'dark' ? '#151617' : '#F8F7F4');
    try {
      localStorage.setItem('ayur_theme', theme);
    } catch (e) {
      console.warn('Could not save theme preference:', e);
    }
  }, [theme, resolvedTheme]);

  const setTheme = (newTheme) => {
    if (newTheme === 'light' || newTheme === 'dark' || newTheme === 'system') {
      setThemeState(newTheme);
    }
  };

  const toggleTheme = () => {
    setThemeState(prev => {
      const current = prev === 'system' ? (systemDark ? 'dark' : 'light') : prev;
      const next = current === 'light' ? 'dark' : 'light';
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme, isDark: resolvedTheme === 'dark', readingPreferences, setReadingPreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
