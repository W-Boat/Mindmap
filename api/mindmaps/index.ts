import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@vercel/postgres';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

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

  // Optional authentication (GET allows unauthenticated for public maps)
  const token = extractToken(req.headers.authorization);
  const payload = token ? verifyToken(token) : null;
  const userId = payload?.userId || null;

  let client;
  try {
    client = await getDbClient();
    await client.connect();

    if (req.method === 'GET') {
      let result;
      if (userId) {
        // Authenticated: return public maps + user's own private maps
        result = await client.query(
          'SELECT id, title, description, is_public, user_id, created_at, updated_at FROM mind_maps WHERE is_public = true OR user_id = $1 ORDER BY updated_at DESC',
          [userId]
        );
      } else {
        // Unauthenticated: return only public maps
        result = await client.query(
          'SELECT id, title, description, is_public, user_id, created_at, updated_at FROM mind_maps WHERE is_public = true ORDER BY updated_at DESC'
        );
      }

      res.status(200).json({
        mindMaps: result.rows.map((row: any) => ({
          id: row.id,
          title: row.title,
          description: row.description,
          isPublic: row.is_public,
          userId: row.user_id,
          createdAt: new Date(row.created_at).getTime(),
          updatedAt: new Date(row.updated_at).getTime(),
        })),
      });
    } else if (req.method === 'POST') {
      // Must be authenticated to create
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized: Must be logged in to create mind maps' });
        return;
      }

      // Create new mind map
      const { title, content, description, isPublic } = req.body;

      if (!title || !content) {
        res.status(400).json({ error: 'Title and content are required' });
        return;
      }

      const publicFlag = isPublic !== undefined ? isPublic : true;
      const id = uuidv4();

      const result = await client.query(
        'INSERT INTO mind_maps (id, user_id, title, description, content, is_public) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, title, description, is_public, user_id, created_at, updated_at',
        [id, userId, title, description || null, content, publicFlag]
      );

      const mindMap = result.rows[0];

      res.status(201).json({
        mindMap: {
          id: mindMap.id,
          title: mindMap.title,
          description: mindMap.description,
          content,
          isPublic: mindMap.is_public,
          userId: mindMap.user_id,
          createdAt: new Date(mindMap.created_at).getTime(),
          updatedAt: new Date(mindMap.updated_at).getTime(),
        },
      });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Mind maps error:', error);
    res.status(500).json({
      error: 'Failed to process mind maps',
      debug: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  } finally {
    if (client) await client.end();
  }
};
