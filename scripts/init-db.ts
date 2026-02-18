/**
 * Database Schema Initialization
 * Run this once to set up tables in Vercel Postgres
 * Command: npx ts-node --esm scripts/init-db.ts
 */

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

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        status VARCHAR(20) DEFAULT 'approved',
        language VARCHAR(5) DEFAULT 'zh',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Created users table');

    // Add columns to users table if they don't exist (for existing databases)
    try {
      await client.query(`ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user'`);
      console.log('✓ Added role column to users table');
    } catch {
      console.log('→ role column already exists');
    }

    try {
      await client.query(`ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'approved'`);
      console.log('✓ Added status column to users table');
    } catch {
      console.log('→ status column already exists');
    }

    try {
      await client.query(`ALTER TABLE users ADD COLUMN language VARCHAR(5) DEFAULT 'zh'`);
      console.log('✓ Added language column to users table');
    } catch {
      console.log('→ language column already exists');
    }

    // Create mind_maps table
    await client.query(`
      CREATE TABLE IF NOT EXISTS mind_maps (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        content TEXT NOT NULL,
        is_public BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Created mind_maps table');

    // Add is_public column if it doesn't exist (for existing databases)
    try {
      await client.query(`ALTER TABLE mind_maps ADD COLUMN is_public BOOLEAN DEFAULT true`);
      console.log('✓ Added is_public column to mind_maps table');
    } catch {
      console.log('→ is_public column already exists');
    }

    // Create user_applications table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_applications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        reason TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Created user_applications table');

    // Create index for faster queries
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_mind_maps_user_id ON mind_maps(user_id);
    `);
    console.log('✓ Created index on user_id');

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_mind_maps_is_public ON mind_maps(is_public);
    `);
    console.log('✓ Created index on is_public');

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    `);
    console.log('✓ Created index on users role');

    console.log('\n✅ Database initialization complete!');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

initDatabase();
