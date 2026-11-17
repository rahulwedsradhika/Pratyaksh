import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function ThemeSwitcher() {
  const { theme, resolvedTheme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="editorial-btn editorial-btn-secondary"
      style={{
        width: '36px',
        height: '36px',
        padding: 0,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-primary)',
        cursor: 'pointer'
      }}
      title={`Theme: ${theme}. Click to toggle.`}
      aria-label="Toggle light and dark theme"
    >
      {resolvedTheme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
    </button>
  );
}

