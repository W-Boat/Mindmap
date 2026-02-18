import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMindMaps, deleteMindMap } from '../services/storageService';
import { MindMap } from '../types';
import { t } from '../lib/i18n';
import { Edit, Trash2, Plus, Search, Eye, EyeOff } from 'lucide-react';
import { fetchWithAuth } from '../services/authService';

export const UserDashboard: React.FC = () => {
  const [maps, setMaps] = useState<MindMap[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadMaps();
  }, []);

  const loadMaps = async () => {
    try {
      const mindMaps = await getMindMaps();
      if (Array.isArray(mindMaps)) {
        setMaps(mindMaps);
      } else {
        setMaps([]);
      }
    } catch (error) {
      console.error('Error loading mind maps:', error);
      setMaps([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (window.confirm(t('messages.confirmDelete'))) {
      await deleteMindMap(id);
      loadMaps();
    }
  };

  const toggleVisibility = async (id: string, currentPublic: boolean) => {
    try {
      const map = maps.find(m => m.id === id);
      if (!map) return;

      const response = await fetchWithAuth(`/api/mindmaps/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: map.title,
          content: map.content,
          description: map.description,
          isPublic: !currentPublic,
        }),
      });

      if (response.ok) {
        loadMaps();
      }
    } catch (error) {
      console.error('Error updating visibility:', error);
    }
  };

  const filteredMaps = maps.filter(m => {
    const search = (searchTerm || '').toLowerCase();
    return (
      (m.title || '').toLowerCase().includes(search) ||
      (m.description || '').toLowerCase().includes(search)
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
    <div className="p-6 md:p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('pages.dashboard')}</h1>
          <p className="text-slate-500">{t('mindmap.myMindmaps')}</p>
        </div>
        <Link
          to="/dashboard/new"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-md shadow-indigo-200"
        >
          <Plus size={18} />
          {t('mindmap.createNew')}
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col">
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

        {/* Table/List */}
        <div className="overflow-auto flex-1">
          {filteredMaps.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <Search size={48} className="mb-4 opacity-20" />
              <p>{t('mindmap.noMindmaps')}</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-sm font-medium border-b border-slate-200">
                  <th className="px-6 py-4">{t('mindmap.title')}</th>
                  <th className="px-6 py-4 hidden md:table-cell">{t('mindmap.description')}</th>
                  <th className="px-6 py-4 hidden sm:table-cell">{t('mindmap.visibility')}</th>
                  <th className="px-6 py-4 hidden sm:table-cell">{t('mindmap.lastUpdated')}</th>
                  <th className="px-6 py-4 text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMaps.map(map => (
                  <tr key={map.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{map.title}</div>
                      <div className="text-xs text-slate-400 md:hidden mt-1">
                        {new Date(map.updatedAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 hidden md:table-cell truncate max-w-xs">
                      {map.description || '-'}
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <button
                        onClick={() => toggleVisibility(map.id, map.isPublic)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 text-slate-700 hover:bg-indigo-100 hover:text-indigo-700 transition-colors text-sm"
                      >
                        {map.isPublic ? (
                          <>
                            <Eye size={14} />
                            {t('mindmap.public')}
                          </>
                        ) : (
                          <>
                            <EyeOff size={14} />
                            {t('mindmap.private')}
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm hidden sm:table-cell">
                      {new Date(map.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => navigate(`/dashboard/edit/${map.id}`)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          title={t('common.edit')}
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={(e) => handleDelete(map.id, e)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title={t('common.delete')}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
