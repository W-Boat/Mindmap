import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/authContext';
import { fetchWithAuth } from '../services/authService';
import { t } from '../lib/i18n';
import { Users, ClipboardList, Settings, ChevronRight } from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingApplications: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [usersRes, appsRes] = await Promise.all([
        fetchWithAuth('/api/admin/users/list'),
        fetchWithAuth('/api/admin/applications/list'),
      ]);

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setStats(prev => ({ ...prev, totalUsers: usersData.users?.length || 0 }));
      }

      if (appsRes.ok) {
        const appsData = await appsRes.json();
        setStats(prev => ({ ...prev, pendingApplications: appsData.applications?.length || 0 }));
      }
    } catch (error) {
      console.error('Error loading admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">{t('admin.dashboard')}</h1>
        <p className="text-slate-500">
          {t('messages.welcome')}, {user?.username}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="text-blue-600" size={24} />
            </div>
            <h3 className="font-semibold text-slate-700">{t('admin.totalUsers')}</h3>
          </div>
          <p className="text-4xl font-bold text-slate-900">{stats.totalUsers}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-orange-100 rounded-lg">
              <ClipboardList className="text-orange-600" size={24} />
            </div>
            <h3 className="font-semibold text-slate-700">{t('admin.totalApplications')}</h3>
          </div>
          <p className="text-4xl font-bold text-slate-900">{stats.pendingApplications}</p>
          {stats.pendingApplications > 0 && (
            <p className="text-sm text-orange-600 mt-1">{t('admin.pendingApplications')}</p>
          )}
        </div>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to="/admin/users"
          className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:border-indigo-300 hover:shadow-md transition-all group flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 rounded-xl group-hover:bg-indigo-100 transition-colors">
              <Users className="text-indigo-600" size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">{t('admin.users')}</h3>
              <p className="text-sm text-slate-500">{t('common.edit')}</p>
            </div>
          </div>
          <ChevronRight className="text-slate-400 group-hover:text-indigo-500 transition-colors" size={20} />
        </Link>

        <Link
          to="/admin/applications"
          className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:border-indigo-300 hover:shadow-md transition-all group flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-50 rounded-xl group-hover:bg-orange-100 transition-colors">
              <ClipboardList className="text-orange-600" size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">{t('admin.applications')}</h3>
              <p className="text-sm text-slate-500">{t('common.approve')}/{t('common.reject')}</p>
            </div>
          </div>
          <ChevronRight className="text-slate-400 group-hover:text-indigo-500 transition-colors" size={20} />
        </Link>
      </div>
    </div>
  );
};
