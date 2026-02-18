import { createClient } from '@vercel/postgres';

async function initDatabase() {
  const connectionString = process.env.POSTGRES_URL_POOLED || process.env.POSTGRES_URL;

  if (!connectionString) {
    console.error('❌ Error: POSTGRES_URL or POSTGRES_URL_POOLED environment variable not set');
    process.exit(1);
  }

  const client = createClient({ connectionString });

  try {
    await client.connect();
    console.log('✓ Connected to database');

    // Create mind_maps table (only table needed)
    await client.query(`
      CREATE TABLE IF NOT EXISTS mind_maps (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Created mind_maps table');

    // Create indexes for faster queries
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_mind_maps_created_at ON mind_maps(created_at DESC);
    `);
    console.log('✓ Created index on created_at');

    console.log('\n✅ Database initialization complete!');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

initDatabase();
