import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

interface JWTPayload {
  userId: string;
  email: string;
  username: string;
  role: 'user' | 'admin';
  language: 'zh' | 'en';
}

function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  return parts.length === 2 && parts[0] === 'Bearer' ? parts[1] : null;
}

async function getDbClient() {
  const connectionString = process.env.POSTGRES_URL_POOLED || process.env.POSTGRES_URL;
  if (!connectionString) {
    throw new Error('Database connection string not configured. Set POSTGRES_URL_POOLED in environment variables.');
  }
  return createClient({ connectionString });
}

export default async (req: VercelRequest, res: VercelResponse) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Optional authentication
  const token = extractToken(req.headers.authorization);
  const payload = token ? verifyToken(token) : null;
  const userId = payload?.userId || null;

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    res.status(400).json({ error: 'Mind map ID is required' });
    return;
  }

  let client;
  try {
    client = await getDbClient();
    await client.connect();

    if (req.method === 'GET') {
      // Get single mind map
      const result = await client.query(
        'SELECT id, title, description, content, is_public, user_id, created_at, updated_at FROM mind_maps WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: 'Mind map not found' });
        return;
      }

      const mindMap = result.rows[0];

      // Check access: public maps visible to all, private maps only to owner
      if (!mindMap.is_public && mindMap.user_id !== userId) {
        res.status(403).json({ error: 'Access denied: This mind map is private' });
        return;
      }

      res.status(200).json({
        mindMap: {
          id: mindMap.id,
          title: mindMap.title,
          description: mindMap.description,
          content: mindMap.content,
          isPublic: mindMap.is_public,
          userId: mindMap.user_id,
          createdAt: new Date(mindMap.created_at).getTime(),
          updatedAt: new Date(mindMap.updated_at).getTime(),
        },
      });
    } else if (req.method === 'PUT') {
      // Must be authenticated to update
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Update mind map
      const { title, content, description, isPublic } = req.body;

      if (!title || !content) {
        res.status(400).json({ error: 'Title and content are required' });
        return;
      }

      const publicFlag = isPublic !== undefined ? isPublic : true;

      const result = await client.query(
        'UPDATE mind_maps SET title = $1, description = $2, content = $3, is_public = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 AND user_id = $6 RETURNING id, title, description, content, is_public, user_id, created_at, updated_at',
        [title, description || null, content, publicFlag, id, userId]
      );

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
          isPublic: mindMap.is_public,
          userId: mindMap.user_id,
          createdAt: new Date(mindMap.created_at).getTime(),
          updatedAt: new Date(mindMap.updated_at).getTime(),
        },
      });
    } else if (req.method === 'DELETE') {
      // Must be authenticated to delete
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Delete mind map
      const result = await client.query(
        'DELETE FROM mind_maps WHERE id = $1 AND user_id = $2 RETURNING id',
        [id, userId]
      );

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
    res.status(500).json({
      error: 'Failed to process mind map',
      debug: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  } finally {
    if (client) await client.end();
  }
};
