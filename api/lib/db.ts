import { createClient } from '@vercel/postgres';

// For serverless functions, we need to use connection pooling
// Use POSTGRES_URL_POOLED which Vercel automatically creates
const getClient = () => {
  const connectionString = process.env.POSTGRES_URL_POOLED || process.env.POSTGRES_URL;

  if (!connectionString) {
    throw new Error('No database connection string found. Set POSTGRES_URL_POOLED or POSTGRES_URL environment variable.');
  }

  return createClient({
    connectionString,
  });
};

export async function query(sql: string, values?: any[]) {
  const client = getClient();

  try {
    await client.connect();
    const result = await client.query(sql, values);
    return result;
  } finally {
    await client.end();
  }
}

export async function getConnection() {
  const client = getClient();
  await client.connect();
  return client;
}
