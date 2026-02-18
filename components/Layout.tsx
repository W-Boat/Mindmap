import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Network, PlusCircle, Settings } from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;
  const linkClass = (path: string) => `
    flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
    ${isActive(path) 
      ? 'bg-indigo-600 text-white shadow-md' 
      : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'}
  `;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col z-20">
        <div className="p-6 border-b border-slate-100">
          <Link to="/" className="flex items-center gap-2 font-bold text-2xl text-slate-800">
            <Network className="text-indigo-600" size={28} />
            <span>MindMap AI</span>
          </Link>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <Link to="/" className={linkClass('/')}>
            <Network size={20} />
            <span>Public Gallery</span>
          </Link>
          <Link to="/admin" className={linkClass('/admin')}>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </Link>
          <Link to="/admin/new" className={linkClass('/admin/new')}>
            <PlusCircle size={20} />
            <span>Create New</span>
          </Link>
        </nav>
        
        <div className="p-4 border-t border-slate-100">
          <div className="text-xs text-slate-400 text-center">
            Powered by Google Gemini
          </div>
        </div>
      </aside>

      {/* Mobile Header (Visible only on small screens) */}
      <div className="md:hidden fixed top-0 w-full bg-white border-b border-slate-200 z-30 px-4 py-3 flex items-center justify-between">
         <Link to="/" className="flex items-center gap-2 font-bold text-xl text-slate-800">
            <Network className="text-indigo-600" size={24} />
            <span>MindMap AI</span>
          </Link>
          <div className="flex gap-4">
            <Link to="/admin" className="text-slate-600"><LayoutDashboard size={24}/></Link>
          </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative w-full pt-16 md:pt-0">
        {children}
      </main>
    </div>
  );
};
