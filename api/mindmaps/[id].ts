import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@vercel/postgres';

async function getDbClient() {
  const connectionString = process.env.POSTGRES_URL_POOLED || process.env.POSTGRES_URL;
  if (!connectionString) {
    throw new Error('Database connection string not configured.');
  }
  return createClient({ connectionString });
}

export default async (req: VercelRequest, res: VercelResponse) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PUT,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    res.status(400).json({ error: 'Mindmap ID is required' });
    return;
  }

  let client;
  try {
    client = await getDbClient();
    await client.connect();

    if (req.method === 'GET') {
      // Get single mindmap
      const result = await client.query(
        'SELECT id, title, description, content, created_at, updated_at FROM mind_maps WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: 'Mindmap not found' });
        return;
      }

      const mindMap = result.rows[0];

      res.status(200).json({
        mindMap: {
          id: mindMap.id,
          title: mindMap.title,
          description: mindMap.description,
          content: mindMap.content,
          createdAt: new Date(mindMap.created_at).getTime(),
          updatedAt: new Date(mindMap.updated_at).getTime(),
        },
      });
    } else if (req.method === 'PUT') {
      // Update mindmap
      const { title, content, description } = req.body;

      if (!title || !content) {
        res.status(400).json({ error: 'Title and content are required' });
        return;
      }

      const result = await client.query(
        'UPDATE mind_maps SET title = $1, description = $2, content = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING id, title, description, content, created_at, updated_at',
        [title, description || null, content, id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: 'Mindmap not found' });
        return;
      }

      const mindMap = result.rows[0];
      res.status(200).json({
        mindMap: {
          id: mindMap.id,
          title: mindMap.title,
          description: mindMap.description,
          content: mindMap.content,
          createdAt: new Date(mindMap.created_at).getTime(),
          updatedAt: new Date(mindMap.updated_at).getTime(),
        },
      });
    } else if (req.method === 'DELETE') {
      // Delete mindmap
      const result = await client.query(
        'DELETE FROM mind_maps WHERE id = $1 RETURNING id',
        [id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: 'Mindmap not found' });
        return;
      }

      res.status(200).json({ message: 'Mindmap deleted successfully' });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Mindmap operation error:', error);
    res.status(500).json({ error: 'Failed to process mindmap' });
  } finally {
    if (client) await client.end();
  }
};
