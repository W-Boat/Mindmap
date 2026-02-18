import { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';
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

export default async (req: VercelRequest, res: VercelResponse) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Verify admin token
  const token = extractToken(req.headers.authorization);
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const payload = verifyToken(token);
  if (!payload || payload.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }

  const { id } = req.query;
  const userId = Array.isArray(id) ? id[0] : id;

  // GET /api/admin/users or /api/admin/users/list - List all users
  if (req.method === 'GET' && (!userId || userId === 'list')) {
    try {
      const result = await sql`
        SELECT id, email, username, role, status, language, created_at, updated_at
        FROM users
        ORDER BY created_at DESC
      `;

      res.status(200).json({
        users: result.rows.map(user => ({
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          status: user.status,
          language: user.language,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
        })),
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  } else if (req.method === 'PUT' && userId && userId !== 'list') {
    // PUT /api/admin/users/:id - Update user role or status
    const { role, status } = req.body;

    if (role && !['user', 'admin'].includes(role)) {
      res.status(400).json({ error: 'Invalid role' });
      return;
    }

    if (status && !['pending', 'approved', 'rejected'].includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    if (!role && !status) {
      res.status(400).json({ error: 'At least one field must be updated' });
      return;
    }

    try {
      let query = 'UPDATE users SET ';
      const updates: string[] = [];
      const values: (string | number)[] = [];

      if (role) {
        updates.push(`role = $${values.length + 1}`);
        values.push(role);
      }

      if (status) {
        updates.push(`status = $${values.length + 1}`);
        values.push(status);
      }

      updates.push(`updated_at = CURRENT_TIMESTAMP`);

      query += updates.join(', ') + ` WHERE id = $${values.length + 1} RETURNING id, email, username, role, status`;
      values.push(userId as string);

      const result = await (sql as any)(query, values);

      if (result.rows.length === 0) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      const user = result.rows[0];

      res.status(200).json({
        message: 'User updated successfully',
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          status: user.status,
        },
      });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  } else if (req.method === 'DELETE' && userId && userId !== 'list') {
    // DELETE /api/admin/users/:id - Delete user
    try {
      const result = await sql`DELETE FROM users WHERE id = ${userId} RETURNING id`;

      if (result.rows.length === 0) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.status(200).json({
        message: 'User deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};
