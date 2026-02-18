import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMindMaps } from '../services/storageService';
import { MindMap } from '../types';
import { MarkmapViewer } from '../components/MarkmapViewer';
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
        <h1 className="text-3xl font-bold text-slate-900">Public Gallery</h1>
        <p className="text-slate-500 mt-2">Explore knowledge graphs and mind maps created by the community.</p>
      </header>

      {selectedMap ? (
        <div className="animate-fadeIn">
           <button 
             onClick={() => setSelectedMap(null)}
             className="mb-4 flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium"
           >
             ← Back to Gallery
           </button>
           <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden flex flex-col h-[70vh] md:h-[80vh]">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{selectedMap.title}</h2>
                  <p className="text-sm text-slate-500">{selectedMap.description}</p>
                </div>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock size={12} />
                  {new Date(selectedMap.updatedAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex-1 w-full h-full relative">
                <MarkmapViewer content={selectedMap.content} className="w-full h-full border-none shadow-none rounded-none" />
              </div>
           </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {maps.map((map) => (
            <div 
              key={map.id} 
              onClick={() => setSelectedMap(map)}
              className="group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300 cursor-pointer flex flex-col h-64 overflow-hidden"
            >
              <div className="p-5 border-b border-slate-50 bg-gradient-to-r from-slate-50 to-white">
                <h3 className="font-bold text-lg text-slate-800 group-hover:text-indigo-600 transition-colors truncate">{map.title}</h3>
                <p className="text-sm text-slate-500 mt-1 line-clamp-1">{map.description || 'No description'}</p>
              </div>
              <div className="flex-1 bg-slate-50/30 p-2 relative overflow-hidden">
                {/* Mini preview (disabled interactivity for list view performance) */}
                <div className="opacity-50 group-hover:opacity-100 transition-opacity absolute inset-0 pointer-events-none">
                  <MarkmapViewer content={map.content} className="w-full h-full border-none shadow-none bg-transparent" fitView={true} />
                </div>
              </div>
              <div className="p-3 bg-white border-t border-slate-100 flex justify-between items-center">
                 <span className="text-xs text-slate-400">{new Date(map.updatedAt).toLocaleDateString()}</span>
                 <span className="text-indigo-600 text-sm font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    View <ArrowRight size={14} />
                 </span>
              </div>
            </div>
          ))}

          {/* Call to action card */}
          <Link 
            to="/admin/new"
            className="group flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-300 rounded-xl hover:border-indigo-400 hover:bg-indigo-50/30 transition-all cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <span className="text-2xl font-bold">+</span>
            </div>
            <h3 className="font-medium text-slate-600 group-hover:text-indigo-600">Create New Map</h3>
            <p className="text-sm text-slate-400 mt-1">Or generate with AI</p>
          </Link>
        </div>
      )}
    </div>
  );
};
