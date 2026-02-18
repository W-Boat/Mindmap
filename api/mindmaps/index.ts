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

  // Optional authentication (GET allows unauthenticated for public maps)
  const token = extractToken(req.headers.authorization);
  const payload = token ? verifyToken(token) : null;
  const userId = payload?.userId || null;

  try {
    if (req.method === 'GET') {
      let result;
      if (userId) {
        // Authenticated: return public maps + user's own private maps
        result = await sql`
          SELECT id, title, description, is_public, user_id, created_at, updated_at
          FROM mind_maps
          WHERE is_public = true OR user_id = ${userId}
          ORDER BY updated_at DESC
        `;
      } else {
        // Unauthenticated: return only public maps
        result = await sql`
          SELECT id, title, description, is_public, user_id, created_at, updated_at
          FROM mind_maps
          WHERE is_public = true
          ORDER BY updated_at DESC
        `;
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

      const result = await sql`
        INSERT INTO mind_maps (user_id, title, description, content, is_public)
        VALUES (${userId}, ${title}, ${description || null}, ${content}, ${publicFlag})
        RETURNING id, title, description, is_public, user_id, created_at, updated_at
      `;

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
    res.status(500).json({ error: 'Failed to process mind maps' });
  }
};
