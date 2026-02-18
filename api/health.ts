import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@vercel/postgres';

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
      POSTGRES_URL_POOLED: !!process.env.POSTGRES_URL_POOLED,
      JWT_SECRET: !!process.env.JWT_SECRET,
      NODE_ENV: process.env.NODE_ENV || 'development',
    };

    // Use pooled connection for serverless
    const connectionString = process.env.POSTGRES_URL_POOLED || process.env.POSTGRES_URL;

    if (!connectionString) {
      res.status(503).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'No database connection string configured',
        environment: envCheck,
        troubleshooting: [
          'POSTGRES_URL_POOLED must be set in Vercel environment variables',
          'Go to Vercel Dashboard → Project Settings → Environment Variables',
          'Verify POSTGRES_URL_POOLED is present (auto-created with Postgres)',
          'Redeploy the project after verifying'
        ],
      });
      return;
    }

    // Try to connect and test the database
    const client = createClient({ connectionString });

    try {
      await client.connect();
      const result = await client.query('SELECT NOW()');
      await client.end();

      const dbConnected = !!result;

      // Try to check if tables exist
      let tablesExist = false;
      try {
        const checkClient = createClient({ connectionString });
        await checkClient.connect();
        const tablesResult = await checkClient.query(
          `SELECT table_name FROM information_schema.tables
           WHERE table_schema = 'public' AND table_name IN ('users', 'mind_maps', 'user_applications')`
        );
        await checkClient.end();
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
          'Run: npm run init-db (locally with POSTGRES_URL_POOLED set)',
          'Or see VERCEL_SETUP.md for deployment instructions'
        ] : [],
      });
    } catch (dbError) {
      throw dbError;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error('Health check error:', {
      message: errorMessage,
      stack: errorStack,
      type: error instanceof Error ? error.constructor.name : typeof error,
    });

    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: errorMessage,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      environment: {
        POSTGRES_URL: !!process.env.POSTGRES_URL,
        POSTGRES_URL_POOLED: !!process.env.POSTGRES_URL_POOLED,
        JWT_SECRET: !!process.env.JWT_SECRET,
        NODE_ENV: process.env.NODE_ENV || 'development',
      },
      troubleshooting: [
        'Database connection failed. Common causes:',
        '1. Database server is down or unreachable',
        '2. Connection credentials in POSTGRES_URL_POOLED are incorrect',
        '3. Firewall or network issue preventing connection',
        '4. Database has not been initialized yet',
        '',
        'Solutions:',
        '- Check database status in Vercel Dashboard → Storage → Postgres',
        '- Verify POSTGRES_URL_POOLED connection string is correct',
        '- Initialize database: export POSTGRES_URL_POOLED=... && npm run init-db',
        '- Check Vercel deployment logs for more details'
      ],
    });
  }
};
