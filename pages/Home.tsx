import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMindMaps } from '../services/storageService';
import { MindMap } from '../types';
import { MarkmapViewer } from '../components/MarkmapViewer';
import { t } from '../lib/i18n';
import { Clock, ArrowRight } from 'lucide-react';

export const Home: React.FC = () => {
  const [maps, setMaps] = useState<MindMap[]>([]);
  const [selectedMap, setSelectedMap] = useState<MindMap | null>(null);

  useEffect(() => {
    const loadMaps = async () => {
      try {
        const data = await getMindMaps();
        if (Array.isArray(data)) {
          setMaps(data);
        } else {
          console.error('getMindMaps returned non-array:', data);
          setMaps([]);
        }
      } catch (error) {
        console.error('Error loading mind maps:', error);
        setMaps([]);
      }
    };
    loadMaps();
  }, []);

  return (
    <div className="min-h-full p-6 md:p-8 max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{t('pages.home')}</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">{t('mindmap.myMindmaps')}</p>
      </header>

      {selectedMap ? (
        <div className="animate-fade-in">
          <button
            onClick={() => setSelectedMap(null)}
            className="mb-4 flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
          >
            ← {t('common.back')}
          </button>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col h-[70vh] md:h-[80vh]">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-700/50">
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">{selectedMap.title}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">{selectedMap.description}</p>
              </div>
              <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                <Clock size={12} />
                {new Date(selectedMap.updatedAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex-1 w-full h-full relative">
              <MarkmapViewer
                content={selectedMap.content}
                className="w-full h-full border-none shadow-none rounded-none"
                showToolbar={true}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {maps.map((map) => (
            <div
              key={map.id}
              onClick={() => setSelectedMap(map)}
              className="group bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl hover:border-indigo-200 dark:hover:border-indigo-600 transition-all duration-300 cursor-pointer flex flex-col h-64 overflow-hidden"
            >
              <div className="p-5 border-b border-slate-50 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-white dark:from-slate-700 dark:to-slate-800">
                <h3 className="font-bold text-lg text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                  {map.title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                  {map.description || t('common.edit')}
                </p>
              </div>
              <div className="flex-1 bg-slate-50/30 dark:bg-slate-700/30 p-2 relative overflow-hidden">
                {/* Mini preview (disabled interactivity for list view performance) */}
                <div className="opacity-50 group-hover:opacity-100 transition-opacity absolute inset-0 pointer-events-none">
                  <MarkmapViewer
                    content={map.content}
                    className="w-full h-full border-none shadow-none bg-transparent"
                    fitView={true}
                    showToolbar={false}
                  />
                </div>
              </div>
              <div className="p-3 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  {new Date(map.updatedAt).toLocaleDateString()}
                </span>
                <span className="text-indigo-600 dark:text-indigo-400 text-sm font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {t('common.edit')} <ArrowRight size={14} />
                </span>
              </div>
            </div>
          ))}

          {/* Call to action card */}
          <Link
            to="/dashboard/new"
            className="group flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl hover:border-indigo-400 hover:bg-indigo-50/30 dark:hover:border-indigo-500 dark:hover:bg-indigo-900/20 transition-all cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <span className="text-2xl font-bold">+</span>
            </div>
            <h3 className="font-medium text-slate-600 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
              {t('mindmap.createNew')}
            </h3>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">{t('pages.dashboard')}</p>
          </Link>
        </div>
      )}
    </div>
  );
};
