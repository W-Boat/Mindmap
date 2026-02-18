export const generateMindMapContent = async (topic: string): Promise<string> => {
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ topic }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `API request failed with status ${response.status}`
      );
    }

    const data = await response.json();
    return data.content || '';
  } catch (error) {
    console.error('AI Service Error:', error);
    throw error;
  }
};
