import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@vercel/postgres';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

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

function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
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
  const appId = Array.isArray(id) ? id[0] : id;

  let client;

  // GET /api/admin/applications or /api/admin/applications/list - List pending applications
  if (req.method === 'GET' && (!appId || appId === 'list')) {
    try {
      client = await getDbClient();
      await client.connect();

      const result = await client.query(
        'SELECT id, email, username, reason, status, created_at, updated_at FROM user_applications WHERE status = $1 ORDER BY created_at DESC',
        ['pending']
      );

      res.status(200).json({
        applications: result.rows.map(app => ({
          id: app.id,
          email: app.email,
          username: app.username,
          reason: app.reason,
          status: app.status,
          createdAt: app.created_at,
          updatedAt: app.updated_at,
        })),
      });
    } catch (error) {
      console.error('Error fetching applications:', error);
      res.status(500).json({
        error: 'Failed to fetch applications',
        debug: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      });
    } finally {
      if (client) await client.end();
    }
  } else if (req.method === 'PUT' && appId && appId !== 'list') {
    // PUT /api/admin/applications/:id - Approve/reject application
    const { action } = req.body; // 'approve' or 'reject'

    if (!action || (action !== 'approve' && action !== 'reject')) {
      res.status(400).json({ error: 'Action must be "approve" or "reject"' });
      return;
    }

    try {
      client = await getDbClient();
      await client.connect();

      // Get application
      const appResult = await client.query(
        'SELECT id, email, username, password_hash FROM user_applications WHERE id = $1',
        [appId]
      );

      if (appResult.rows.length === 0) {
        res.status(404).json({ error: 'Application not found' });
        return;
      }

      const app = appResult.rows[0];

      if (action === 'approve') {
        // Create user account
        await client.query(
          'INSERT INTO users (email, username, password_hash, role, status, language) VALUES ($1, $2, $3, $4, $5, $6)',
          [app.email, app.username, app.password_hash, 'user', 'approved', 'zh']
        );

        // Update application status
        await client.query(
          'UPDATE user_applications SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          ['approved', appId]
        );

        res.status(200).json({
          message: 'Application approved and user account created',
        });
      } else if (action === 'reject') {
        // Update application status
        await client.query(
          'UPDATE user_applications SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          ['rejected', appId]
        );

        res.status(200).json({
          message: 'Application rejected',
        });
      }
    } catch (error) {
      console.error('Error processing application:', error);
      res.status(500).json({
        error: 'Failed to process application',
        debug: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      });
    } finally {
      if (client) await client.end();
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};
