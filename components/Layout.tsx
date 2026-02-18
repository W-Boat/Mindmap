import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/authContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { DarkModeToggle } from './DarkModeToggle';
import { t } from '../lib/i18n';
import { LayoutDashboard, Network, PlusCircle, LogOut, LogIn, Settings, Shield } from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated, isAdmin, user, logout } = useAuth();

  const isActive = (path: string) => {
    // Check if the current path starts with the given path
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
            <span>MindMap AI</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Link to="/" className={linkClass('/')}>
            <Network size={20} />
            <span>{t('pages.home')}</span>
          </Link>

          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className={linkClass('/dashboard')}>
                <LayoutDashboard size={20} />
                <span>{t('pages.dashboard')}</span>
              </Link>

              <Link to="/dashboard/new" className={linkClass('/dashboard/new')}>
                <PlusCircle size={20} />
                <span>{t('mindmap.createNew')}</span>
              </Link>

              {isAdmin && (
                <>
                  <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-700">
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-2 uppercase">
                      {t('common.admin')}
                    </div>
                    <Link to="/admin" className={linkClass('/admin')}>
                      <Shield size={20} />
                      <span>{t('pages.adminPanel')}</span>
                    </Link>
                    <Link to="/admin/users" className={linkClass('/admin/users')}>
                      <Settings size={20} />
                      <span>{t('pages.adminUsers')}</span>
                    </Link>
                    <Link to="/admin/applications" className={linkClass('/admin/applications')}>
                      <Settings size={20} />
                      <span>{t('pages.adminApplications')}</span>
                    </Link>
                  </div>
                </>
              )}
            </>
          ) : null}
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-700 space-y-3">
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <DarkModeToggle />
          </div>

          {isAuthenticated ? (
            <div className="space-y-2">
              <div className="text-xs font-medium text-slate-600 dark:text-slate-400 px-2 truncate">
                {user?.email}
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-4 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-slate-700 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              >
                <LogOut size={18} />
                <span>{t('common.logout')}</span>
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="w-full flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 dark:bg-indigo-700 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors justify-center"
            >
              <LogIn size={18} />
              <span>{t('common.login')}</span>
            </Link>
          )}
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 z-30 px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl text-slate-800 dark:text-white">
          <Network className="text-indigo-600 dark:text-indigo-400" size={24} />
          <span>MindMap AI</span>
        </Link>
        <div className="flex gap-2">
          <LanguageSwitcher />
          <DarkModeToggle />
          {isAuthenticated && (
            <button
              onClick={logout}
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              <LogOut size={20} />
            </button>
          )}
          {!isAuthenticated && (
            <Link to="/login" className="p-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              <LogIn size={20} />
            </Link>
          )}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative w-full pt-16 md:pt-0 dark:bg-slate-900">
        {children}
      </main>
    </div>
  );
};
