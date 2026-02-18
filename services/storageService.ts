import { MindMap } from '../types';
import { fetchWithAuth, isAuthenticated } from './authService';

// Fallback to localStorage for offline/unauthenticated use
const STORAGE_KEY = 'mindmaps';

// Get initial dummy data
const getInitialData = (): MindMap[] => {
  const existing = localStorage.getItem(STORAGE_KEY);
  if (existing) {
    try {
      const parsed = JSON.parse(existing);
      // Ensure it's an array
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (e) {
      console.error('Error parsing localStorage data:', e);
      // Clear bad data
      localStorage.removeItem(STORAGE_KEY);
    }
  }
  const initialData: MindMap[] = [
    {
      id: '1',
      title: 'Project Overview',
      content: '# Project Overview\n## Features\n- Feature 1\n- Feature 2\n## Timeline\n- Phase 1\n- Phase 2',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      description: 'An example mind map demonstrating features.'
    }
  ];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
  return initialData;
};

export const getMindMaps = async (): Promise<MindMap[]> => {
  try {
    if (isAuthenticated()) {
      const response = await fetchWithAuth('/api/mindmaps');
      if (response.ok) {
        const data = await response.json();
        const maps = data.mindMaps;
        return Array.isArray(maps) ? maps : [];
      }
    }
  } catch (error) {
    console.error('Error fetching mind maps from backend:', error);
  }

  return getInitialData().sort((a, b) => b.updatedAt - a.updatedAt);
};

export const getMindMapById = async (id: string): Promise<MindMap | undefined> => {
  try {
    if (isAuthenticated()) {
      const response = await fetchWithAuth(`/api/mindmaps/${id}`);
      if (response.ok) {
        const data = await response.json();
        return data.mindMap;
      }
    }
  } catch (error) {
    console.error('Error fetching mind map from backend:', error);
  }

  const maps = getInitialData();
  return maps.find(m => m.id === id);
};

export const saveMindMap = async (map: MindMap): Promise<void> => {
  try {
    if (!map || typeof map !== 'object') {
      console.error('Invalid mind map object:', map);
      return;
    }

    if (isAuthenticated()) {
      const url = map.id.length === 36 ? `/api/mindmaps/${map.id}` : '/api/mindmaps';
      const method = map.id.length === 36 ? 'PUT' : 'POST';

      const response = await fetchWithAuth(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: map.title,
          description: map.description,
          content: map.content,
        }),
      });

      if (response.ok) {
        return;
      }
    }
  } catch (error) {
    console.error('Error saving mind map to backend:', error);
  }

  // Fallback to localStorage
  try {
    const maps = getInitialData();
    if (!Array.isArray(maps)) {
      console.error('localStorage data is not an array, resetting');
      localStorage.removeItem(STORAGE_KEY);
      return saveMindMap(map);
    }

    const existingIndex = maps.findIndex(m => m.id === map.id);

    if (existingIndex >= 0) {
      maps[existingIndex] = { ...map, updatedAt: Date.now() };
    } else {
      maps.push({ ...map, createdAt: Date.now(), updatedAt: Date.now() });
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(maps));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

export const deleteMindMap = async (id: string): Promise<void> => {
  if (!id) {
    console.error('Invalid mind map ID:', id);
    return;
  }

  try {
    if (isAuthenticated()) {
      const response = await fetchWithAuth(`/api/mindmaps/${id}`, { method: 'DELETE' });
      if (response.ok) {
        return;
      }
    }
  } catch (error) {
    console.error('Error deleting mind map from backend:', error);
  }

  // Fallback to localStorage
  try {
    const maps = getInitialData();
    if (!Array.isArray(maps)) {
      console.error('localStorage data is not an array');
      return;
    }
    const newMaps = maps.filter(m => m.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newMaps));
  } catch (error) {
    console.error('Error deleting from localStorage:', error);
  }
};

