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
      console.log('Attempting to connect to database...');
      await client.connect();
      console.log('Connected! Testing query...');

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
      } catch (tableCheckError) {
        console.error('Error checking tables:', tableCheckError);
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
          'Run: export POSTGRES_URL_POOLED="..." && npm run init-db',
          'Then redeploy'
        ] : [],
      });
    } catch (dbError) {
      throw dbError;
    }
  } catch (error) {
    // Extract error information in different formats
    let errorMsg = 'Unknown error';
    let errorCode = 'UNKNOWN';

    if (error instanceof Error) {
      errorMsg = error.message;
      errorCode = (error as any).code || 'ERROR';
    } else if (typeof error === 'object' && error !== null) {
      errorMsg = JSON.stringify(error);
      errorCode = (error as any).code || 'OBJECT_ERROR';
    } else {
      errorMsg = String(error);
    }

    console.error('Database connection error:', {
      message: errorMsg,
      code: errorCode,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      fullError: error,
    });

    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: errorMsg,
      errorCode: errorCode,
      environment: {
        POSTGRES_URL: !!process.env.POSTGRES_URL,
        POSTGRES_URL_POOLED: !!process.env.POSTGRES_URL_POOLED,
        JWT_SECRET: !!process.env.JWT_SECRET,
        NODE_ENV: process.env.NODE_ENV || 'development',
      },
      troubleshooting: [
        'Database connection failed.',
        '',
        'If error is "too many connections":',
        '- Database pool is exhausted',
        '- Restart your Vercel Postgres database in Dashboard → Storage',
        '',
        'If error contains "ECONNREFUSED":',
        '- Database server is not running',
        '- Check Vercel Dashboard → Storage → Postgres status',
        '',
        'If error contains "password authentication failed":',
        '- Check POSTGRES_URL_POOLED credentials are correct',
        '- Regenerate connection string in Vercel Dashboard',
        '',
        'If tables are missing:',
        '- Run: export POSTGRES_URL_POOLED="..." && npm run init-db',
        '',
        'Check Vercel deployment logs for more details',
      ],
    });
  }
};
