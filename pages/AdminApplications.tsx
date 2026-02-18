import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchWithAuth } from '../services/authService';
import { t } from '../lib/i18n';
import { ChevronLeft, Check, X, ClipboardList } from 'lucide-react';

interface Application {
  id: string;
  email: string;
  username: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export const AdminApplications: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      const response = await fetchWithAuth('/api/admin/applications/list');
      if (response.ok) {
        const data = await response.json();
        setApplications(data.applications || []);
      }
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    const message = action === 'approve'
      ? t('admin.approveApplication')
      : t('admin.rejectApplication');

    if (!window.confirm(`${message}?`)) return;

    try {
      const response = await fetchWithAuth(`/api/admin/applications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        loadApplications();
      }
    } catch (error) {
      console.error(`Error ${action}ing application:`, error);
    }
  };

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

      <h1 className="text-2xl font-bold text-slate-900 mb-8">{t('admin.applications')}</h1>

      {applications.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-16 text-center">
          <ClipboardList className="mx-auto mb-4 text-slate-300" size={48} />
          <p className="text-slate-500">{t('admin.pendingApplications')}: 0</p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map(app => (
            <div key={app.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-slate-900">{app.username}</h3>
                  <p className="text-slate-600 text-sm">{app.email}</p>

                  {app.reason && (
                    <div className="mt-2 p-3 bg-slate-50 rounded-lg">
                      <p className="text-sm font-medium text-slate-500 mb-1">{t('admin.applicationReason')}:</p>
                      <p className="text-sm text-slate-700">{app.reason}</p>
                    </div>
                  )}

                  <p className="text-xs text-slate-400 mt-2">
                    {new Date(app.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="flex gap-2 sm:flex-col sm:gap-2">
                  <button
                    onClick={() => handleAction(app.id, 'approve')}
                    className="flex items-center gap-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                  >
                    <Check size={16} />
                    {t('common.approve')}
                  </button>
                  <button
                    onClick={() => handleAction(app.id, 'reject')}
                    className="flex items-center gap-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                  >
                    <X size={16} />
                    {t('common.reject')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
