import { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';

export default async (req: VercelRequest, res: VercelResponse) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed. Use GET.' });
    return;
  }

  try {
    // Check environment variables
    const envCheck = {
      POSTGRES_URL: !!process.env.POSTGRES_URL,
      JWT_SECRET: !!process.env.JWT_SECRET,
      NODE_ENV: process.env.NODE_ENV || 'development',
    };

    // Try to connect to database
    const result = await sql`SELECT NOW()`;
    const dbConnected = !!result;

    // Try to check if tables exist
    let tablesExist = false;
    try {
      const tablesResult = await sql`
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name IN ('users', 'mind_maps', 'user_applications')
      `;
      tablesExist = tablesResult.rows.length >= 3;
    } catch {
      // Tables might not exist yet
    }

    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: {
        connected: dbConnected,
        tables_initialized: tablesExist,
      },
      environment: envCheck,
      next_steps: !tablesExist ? [
        'Database connected but tables not initialized',
        'Run: npm run init-db (locally with POSTGRES_URL set)',
        'Or see VERCEL_SETUP.md for deployment instructions'
      ] : [],
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
      environment: {
        POSTGRES_URL: !!process.env.POSTGRES_URL,
        JWT_SECRET: !!process.env.JWT_SECRET,
        NODE_ENV: process.env.NODE_ENV || 'development',
      },
      troubleshooting: [
        'Check that POSTGRES_URL environment variable is set',
        'Verify database credentials are correct',
        'Ensure database server is running and accessible',
        'Check Vercel deployment logs for more details',
      ],
    });
  }
};
