import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { fetchWithAuth } from '../services/authService';
import { t } from '../lib/i18n';
import { ChevronLeft, Search, Trash2, Shield } from 'lucide-react';

interface AdminUser {
  id: string;
  email: string;
  username: string;
  role: 'user' | 'admin';
  status: string;
  createdAt: string;
  updatedAt: string;
}

export const AdminUsers: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await fetchWithAuth('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        console.error('Failed to load users:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id: string, username: string) => {
    if (window.confirm(t('admin.confirmDeleteUser'))) {
      try {
        const response = await fetchWithAuth(`/api/admin/users/${id}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          loadUsers();
        }
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const handleToggleRole = async (id: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      const response = await fetchWithAuth(`/api/admin/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (response.ok) {
        loadUsers();
      }
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  };

  const filteredUsers = users.filter(u => {
    const search = (searchTerm || '').toLowerCase();
    return (
      (u.email || '').toLowerCase().includes(search) ||
      (u.username || '').toLowerCase().includes(search)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <Link
        to="/admin"
        className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 mb-6"
      >
        <ChevronLeft size={18} />
        {t('common.back')}
      </Link>

      <h1 className="text-2xl font-bold text-slate-900 mb-8">{t('admin.allUsers')}</h1>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder={t('common.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-sm font-medium border-b border-slate-200">
                <th className="px-6 py-4">{t('admin.email')}</th>
                <th className="px-6 py-4">{t('admin.username')}</th>
                <th className="px-6 py-4 hidden sm:table-cell">{t('admin.role')}</th>
                <th className="px-6 py-4 hidden md:table-cell">{t('admin.status')}</th>
                <th className="px-6 py-4 text-right">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{user.username}</td>
                  <td className="px-6 py-4 hidden sm:table-cell">
                    <button
                      onClick={() => handleToggleRole(user.id, user.role)}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm font-medium transition-colors ${
                        user.role === 'admin'
                          ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <Shield size={14} />
                      {user.role === 'admin' ? t('common.admin') : t('common.user')}
                    </button>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      {t('common.approved')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDeleteUser(user.id, user.username)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title={t('common.delete')}
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="flex items-center justify-center h-64 text-slate-400">
            <p>{t('mindmap.noMindmaps')}</p>
          </div>
        )}
      </div>
    </div>
  );
};
