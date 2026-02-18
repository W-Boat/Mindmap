import { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';
import { verifyToken, extractToken, hashPassword, generateToken } from '../../lib/auth';

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

  // GET /api/admin/applications or /api/admin/applications/list - List pending applications
  if (req.method === 'GET' && (!id || id === 'list')) {
    try {
      const result = await sql`
        SELECT id, email, username, reason, status, created_at, updated_at
        FROM user_applications
        WHERE status = 'pending'
        ORDER BY created_at DESC
      `;

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
      res.status(500).json({ error: 'Failed to fetch applications' });
    }
  } else if (req.method === 'PUT' && id && id !== 'list') {
    // PUT /api/admin/applications/:id - Approve/reject application
    const { action } = req.body; // 'approve' or 'reject'

    if (!action || (action !== 'approve' && action !== 'reject')) {
      res.status(400).json({ error: 'Action must be "approve" or "reject"' });
      return;
    }

    try {
      // Get application
      const appResult = await sql`
        SELECT id, email, username, password_hash FROM user_applications WHERE id = ${id}
      `;

      if (appResult.rows.length === 0) {
        res.status(404).json({ error: 'Application not found' });
        return;
      }

      const app = appResult.rows[0];

      if (action === 'approve') {
        // Create user account
        await sql`
          INSERT INTO users (email, username, password_hash, role, status, language)
          VALUES (${app.email}, ${app.username}, ${app.password_hash}, 'user', 'approved', 'zh')
        `;

        // Update application status
        await sql`
          UPDATE user_applications SET status = 'approved', updated_at = CURRENT_TIMESTAMP WHERE id = ${id}
        `;

        res.status(200).json({
          message: 'Application approved and user account created',
        });
      } else if (action === 'reject') {
        // Update application status
        await sql`
          UPDATE user_applications SET status = 'rejected', updated_at = CURRENT_TIMESTAMP WHERE id = ${id}
        `;

        res.status(200).json({
          message: 'Application rejected',
        });
      }
    } catch (error) {
      console.error('Error processing application:', error);
      res.status(500).json({ error: 'Failed to process application' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};
