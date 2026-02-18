import React from 'react';
import { useDarkMode } from '../lib/darkModeContext';
import { Moon, Sun } from 'lucide-react';

export const DarkModeToggle: React.FC = () => {
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  return (
    <button
      onClick={toggleDarkMode}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700 transition-all"
      title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDarkMode ? (
        <>
          <Sun size={16} />
          <span className="hidden sm:inline">Light</span>
        </>
      ) : (
        <>
          <Moon size={16} />
          <span className="hidden sm:inline">Dark</span>
        </>
      )}
    </button>
  );
};
