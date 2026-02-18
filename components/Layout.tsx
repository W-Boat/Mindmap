import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LanguageSwitcher } from './LanguageSwitcher';
import { DarkModeToggle } from './DarkModeToggle';
import { t } from '../lib/i18n';
import { Network, PlusCircle } from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const linkClass = (path: string) => `
    flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
    ${isActive(path)
      ? 'bg-indigo-600 text-white shadow-md dark:bg-indigo-700'
      : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-indigo-400'}
  `;

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 hidden md:flex flex-col z-20">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700">
          <Link to="/" className="flex items-center gap-2 font-bold text-2xl text-slate-800 dark:text-white">
            <Network className="text-indigo-600 dark:text-indigo-400" size={28} />
            <span>MindMap</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Link to="/" className={linkClass('/')}>
            <Network size={20} />
            <span>{t('pages.home')}</span>
          </Link>

          <Link to="/create" className={linkClass('/create')}>
            <PlusCircle size={20} />
            <span>{t('mindmap.createNew')}</span>
          </Link>
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-700 space-y-3">
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <DarkModeToggle />
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 z-30 px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl text-slate-800 dark:text-white">
          <Network className="text-indigo-600 dark:text-indigo-400" size={24} />
          <span>MindMap</span>
        </Link>
        <div className="flex gap-2">
          <LanguageSwitcher />
          <DarkModeToggle />
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative w-full pt-16 md:pt-0 dark:bg-slate-900">
        {children}
      </main>
    </div>
  );
};
