import { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';

async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
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

  if (req.method === 'GET') {
    res.status(200).json({
      message: 'Registration API endpoint',
      method: 'POST',
      required_fields: ['email', 'username', 'password'],
      optional_fields: ['reason']
    });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed. Use POST.' });
    return;
  }

  const { email, username, password, reason } = req.body;

  // Validation
  if (!email || !username || !password) {
    res.status(400).json({ error: 'Email, username, and password are required' });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters' });
    return;
  }

  try {
    // Check if email or username is already taken in either users or applications table
    const [existingUser, existingApp] = await Promise.all([
      sql`SELECT id FROM users WHERE email = ${email} OR username = ${username}`,
      sql`SELECT id FROM user_applications WHERE email = ${email} OR username = ${username}`,
    ]);

    if (existingUser.rows.length > 0) {
      res.status(409).json({ error: 'Email or username already in use' });
      return;
    }

    if (existingApp.rows.length > 0) {
      res.status(409).json({ error: 'Email or username already has a pending application' });
      return;
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create application
    const result = await sql`
      INSERT INTO user_applications (email, username, password_hash, reason)
      VALUES (${email}, ${username}, ${passwordHash}, ${reason || null})
      RETURNING id, email, username, status, created_at
    `;

    const application = result.rows[0];

    res.status(201).json({
      message: 'Registration application submitted successfully. Waiting for admin approval.',
      application: {
        id: application.id,
        email: application.email,
        username: application.username,
        status: application.status,
        createdAt: application.created_at,
      },
    });
  } catch (error) {
    console.error('Register error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: error instanceof Error ? error.constructor.name : typeof error,
    });
    res.status(500).json({
      error: 'Failed to submit registration application',
      debug: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
};
