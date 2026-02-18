import { MindMap } from '../types';

export const getMindMaps = async (): Promise<MindMap[]> => {
  try {
    const response = await fetch('/api/mindmaps');
    if (response.ok) {
      const data = await response.json();
      return Array.isArray(data.mindMaps) ? data.mindMaps : [];
    }
  } catch (error) {
    console.error('Error fetching mind maps:', error);
  }
  return [];
};

export const getMindMapById = async (id: string): Promise<MindMap | undefined> => {
  try {
    const response = await fetch(`/api/mindmaps/${id}`);
    if (response.ok) {
      const data = await response.json();
      return data.mindMap;
    }
  } catch (error) {
    console.error('Error fetching mind map:', error);
  }
  return undefined;
};

export const saveMindMap = async (map: MindMap): Promise<void> => {
  try {
    const url = map.id && map.id.length === 36 ? `/api/mindmaps/${map.id}` : '/api/mindmaps';
    const method = map.id && map.id.length === 36 ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: map.title,
        description: map.description,
        content: map.content,
      }),
    });

    if (!response.ok) {
      throw new Error(`Save failed: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error saving mind map:', error);
    throw error;
  }
};

export const deleteMindMap = async (id: string): Promise<void> => {
  try {
    const response = await fetch(`/api/mindmaps/${id}`, { method: 'DELETE' });

    if (!response.ok) {
      throw new Error(`Delete failed: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error deleting mind map:', error);
    throw error;
  }
};
