import { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';
import { verifyToken, extractToken } from '../../lib/auth';

export default async (req: VercelRequest, res: VercelResponse) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Verify authentication
  const token = extractToken(req.headers.authorization);
  if (!token) {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
    return;
  }

  const userId = payload.userId;

  try {
    if (req.method === 'GET') {
      // List all mind maps for the user
      const result = await sql`
        SELECT id, title, description, created_at, updated_at
        FROM mind_maps
        WHERE user_id = ${userId}
        ORDER BY updated_at DESC
      `;

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
      // Create new mind map
      const { title, content, description } = req.body;

      if (!title || !content) {
        res.status(400).json({ error: 'Title and content are required' });
        return;
      }

      const result = await sql`
        INSERT INTO mind_maps (user_id, title, description, content)
        VALUES (${userId}, ${title}, ${description || null}, ${content})
        RETURNING id, title, description, created_at, updated_at
      `;

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
    console.error('Mind maps error:', error);
    res.status(500).json({ error: 'Failed to process mind maps' });
  }
};
