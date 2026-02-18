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

async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
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

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { email, username, password, language } = req.body;

  // Validation
  if (!email || !username || !password) {
    res.status(400).json({ error: 'Email, username, and password are required' });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters' });
    return;
  }

  let client;
  try {
    client = await getDbClient();
    await client.connect();

    // Check if user already exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      res.status(409).json({ error: 'Email or username already exists' });
      return;
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Determine role - first user is admin, others are regular users
    const userCount = await client.query('SELECT COUNT(*) as count FROM users');
    const isFirstUser = parseInt(userCount.rows[0].count) === 0;
    const role = isFirstUser ? 'admin' : 'user';
    const lang = language === 'en' ? 'en' : 'zh';

    // Create user
    const result = await client.query(
      'INSERT INTO users (email, username, password_hash, role, language) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, username, role, language',
      [email, username, passwordHash, role, lang]
    );

    const user = result.rows[0];

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      language: user.language,
    });

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        language: user.language,
      },
    });
  } catch (error) {
    console.error('Signup error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: error instanceof Error ? error.constructor.name : typeof error,
    });
    res.status(500).json({
      error: 'Failed to create user',
      debug: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  } finally {
    if (client) await client.end();
  }
};
