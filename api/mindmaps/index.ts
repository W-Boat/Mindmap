import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@vercel/postgres';
import { v4 as uuidv4 } from 'uuid';

async function getDbClient() {
  const connectionString = process.env.POSTGRES_URL;
  if (!connectionString) {
    throw new Error('Database connection string not configured.');
  }
  return createClient({ connectionString });
}

export default async (req: VercelRequest, res: VercelResponse) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  let client;
  try {
    client = await getDbClient();
    await client.connect();

    if (req.method === 'GET') {
      // Get all mindmaps
      const result = await client.query(
        'SELECT id, title, description, created_at, updated_at FROM mind_maps ORDER BY created_at DESC'
      );

      res.status(200).json({
        mindMaps: result.rows.map((row: any) => ({
          id: row.id,
          title: row.title,
          description: row.description,
          createdAt: new Date(row.created_at).getTime(),
          updatedAt: new Date(row.updated_at).getTime(),
        })),
      });
    } else if (req.method === 'POST') {
      // Create new mindmap
      const { title, content, description } = req.body;

      if (!title || !content) {
        res.status(400).json({ error: 'Title and content are required' });
        return;
      }

      const id = uuidv4();
      const result = await client.query(
        'INSERT INTO mind_maps (id, title, description, content) VALUES ($1, $2, $3, $4) RETURNING id, title, description, created_at, updated_at',
        [id, title, description || null, content]
      );

      const mindMap = result.rows[0];

      res.status(201).json({
        mindMap: {
          id: mindMap.id,
          title: mindMap.title,
          description: mindMap.description,
          content,
          createdAt: new Date(mindMap.created_at).getTime(),
          updatedAt: new Date(mindMap.updated_at).getTime(),
        },
      });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Mindmap error:', error);
    res.status(500).json({ error: 'Failed to process mindmaps' });
  } finally {
    if (client) await client.end();
  }
};
