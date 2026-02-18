import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchWithAuth } from '../services/authService';
import { MindMap } from '../types';
import { MarkmapViewer } from '../components/MarkmapViewer';
import { t } from '../lib/i18n';
import { ChevronLeft, Clock, Eye, EyeOff } from 'lucide-react';

export const MindmapDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [mindMap, setMindMap] = useState<MindMap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadMindMap();
  }, [id]);

  const loadMindMap = async () => {
    if (!id) {
      setError(t('messages.notFound'));
      setLoading(false);
      return;
    }

    try {
      const response = await fetchWithAuth(`/api/mindmaps/${id}`);
      if (response.ok) {
        const data = await response.json();
        setMindMap(data.mindMap);
      } else if (response.status === 404) {
        setError(t('messages.notFound'));
      } else if (response.status === 403) {
        setError(t('messages.accessDenied'));
      } else {
        setError(t('messages.serverError'));
      }
    } catch (err) {
      console.error('Error loading mind map:', err);
      setError(t('messages.serverError'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !mindMap) {
    return (
      <div className="min-h-full p-6 md:p-8 max-w-7xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium mb-6"
        >
          <ChevronLeft size={18} />
          {t('common.back')}
        </Link>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
          <p className="text-red-700 dark:text-red-300 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full p-6 md:p-8 max-w-7xl mx-auto flex flex-col">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium mb-6 w-fit"
      >
        <ChevronLeft size={18} />
        {t('common.back')}
      </Link>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col flex-1 h-[70vh] md:h-[80vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-white dark:from-slate-700 dark:to-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                {mindMap.title}
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                {mindMap.description || t('common.noData')}
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                {mindMap.isPublic ? (
                  <>
                    <Eye size={16} />
                    <span>{t('mindmap.public')}</span>
                  </>
                ) : (
                  <>
                    <EyeOff size={16} />
                    <span>{t('mindmap.private')}</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <Clock size={16} />
                <span>{new Date(mindMap.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mindmap Viewer */}
        <div className="flex-1 relative w-full">
          <MarkmapViewer
            content={mindMap.content}
            className="w-full h-full border-none shadow-none rounded-none"
            showToolbar={true}
          />
        </div>
      </div>
    </div>
  );
};
