import { MindMap } from '../types';
import { fetchWithAuth, isAuthenticated } from './authService';

// Fallback to localStorage for offline/unauthenticated use
const STORAGE_KEY = 'mindmaps';

// Get initial dummy data
const getInitialData = (): MindMap[] => {
  const existing = localStorage.getItem(STORAGE_KEY);
  if (existing) {
    return JSON.parse(existing);
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
    // If authenticated, fetch from backend
    if (isAuthenticated()) {
      const response = await fetchWithAuth('/api/mindmaps');
      if (response.ok) {
        const data = await response.json();
        return data.mindMaps || [];
      }
    }
  } catch (error) {
    console.error('Error fetching mind maps from backend:', error);
  }

  // Fallback to localStorage
  return getInitialData().sort((a, b) => b.updatedAt - a.updatedAt);
};

export const getMindMapById = async (id: string): Promise<MindMap | undefined> => {
  try {
    // If authenticated, fetch from backend
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

  // Fallback to localStorage
  const maps = getInitialData();
  return maps.find(m => m.id === id);
};

export const saveMindMap = async (map: MindMap): Promise<void> => {
  try {
    // If authenticated, save to backend
    if (isAuthenticated()) {
      const url = map.id.length === 36 ? `/api/mindmaps/${map.id}` : '/api/mindmaps'; // UUID is 36 chars
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
        return; // Successfully saved to backend
      }
    }
  } catch (error) {
    console.error('Error saving mind map to backend:', error);
  }

  // Fallback to localStorage
  const maps = getInitialData();
  const existingIndex = maps.findIndex(m => m.id === map.id);

  if (existingIndex >= 0) {
    maps[existingIndex] = { ...map, updatedAt: Date.now() };
  } else {
    maps.push({ ...map, createdAt: Date.now(), updatedAt: Date.now() });
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(maps));
};

export const deleteMindMap = async (id: string): Promise<void> => {
  try {
    // If authenticated, delete from backend
    if (isAuthenticated()) {
      const response = await fetchWithAuth(`/api/mindmaps/${id}`, { method: 'DELETE' });
      if (response.ok) {
        return; // Successfully deleted from backend
      }
    }
  } catch (error) {
    console.error('Error deleting mind map from backend:', error);
  }

  // Fallback to localStorage
  const maps = getInitialData();
  const newMaps = maps.filter(m => m.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newMaps));
};

