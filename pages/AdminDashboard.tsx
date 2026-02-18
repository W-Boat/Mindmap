import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMindMaps, deleteMindMap } from '../services/storageService';
import { MindMap } from '../types';
import { Edit, Trash2, Plus, Search } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [maps, setMaps] = useState<MindMap[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadMaps();
  }, []);

  const loadMaps = async () => {
    try {
      const mindMaps = await getMindMaps();
      // Ensure we always have an array
      if (Array.isArray(mindMaps)) {
        setMaps(mindMaps);
      } else {
        console.error('getMindMaps returned non-array:', mindMaps);
        setMaps([]);
      }
    } catch (error) {
      console.error('Error loading mind maps:', error);
      setMaps([]);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (window.confirm('Are you sure you want to delete this mind map?')) {
      await deleteMindMap(id);
      loadMaps();
    }
  };

  const filteredMaps = maps.filter(m => {
    const search = (searchTerm || '').toLowerCase();
    return (
      (m.title || '').toLowerCase().includes(search) ||
      (m.description || '').toLowerCase().includes(search)
    );
  });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500">Manage your mind maps</p>
        </div>
        <Link 
          to="/admin/new" 
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-md shadow-indigo-200"
        >
          <Plus size={18} />
          Create New
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col">
        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search maps..." 
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
              <p>No mind maps found.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-sm font-medium border-b border-slate-200">
                  <th className="px-6 py-4">Title</th>
                  <th className="px-6 py-4 hidden md:table-cell">Description</th>
                  <th className="px-6 py-4 hidden sm:table-cell">Last Updated</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMaps.map(map => (
                  <tr key={map.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{map.title}</div>
                      <div className="text-xs text-slate-400 md:hidden mt-1">{new Date(map.updatedAt).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 hidden md:table-cell truncate max-w-xs">
                      {map.description || '-'}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm hidden sm:table-cell">
                      {new Date(map.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => navigate(`/admin/edit/${map.id}`)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={(e) => handleDelete(map.id, e)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete"
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
