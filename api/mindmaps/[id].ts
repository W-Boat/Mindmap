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
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    res.status(400).json({ error: 'Mind map ID is required' });
    return;
  }

  try {
    if (req.method === 'GET') {
      // Get single mind map
      const result = await sql`
        SELECT id, title, description, content, created_at, updated_at
        FROM mind_maps
        WHERE id = ${id} AND user_id = ${userId}
      `;

      if (result.rows.length === 0) {
        res.status(404).json({ error: 'Mind map not found' });
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
      // Update mind map
      const { title, content, description } = req.body;

      if (!title || !content) {
        res.status(400).json({ error: 'Title and content are required' });
        return;
      }

      const result = await sql`
        UPDATE mind_maps
        SET title = ${title},
            description = ${description || null},
            content = ${content},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id} AND user_id = ${userId}
        RETURNING id, title, description, content, created_at, updated_at
      `;

      if (result.rows.length === 0) {
        res.status(404).json({ error: 'Mind map not found' });
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
      // Delete mind map
      const result = await sql`
        DELETE FROM mind_maps
        WHERE id = ${id} AND user_id = ${userId}
        RETURNING id
      `;

      if (result.rows.length === 0) {
        res.status(404).json({ error: 'Mind map not found' });
        return;
      }

      res.status(200).json({ message: 'Mind map deleted successfully' });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Mind map operation error:', error);
    res.status(500).json({ error: 'Failed to process mind map' });
  }
};
